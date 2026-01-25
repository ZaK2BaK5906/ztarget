-- Z_Dispatch Client
-- Systeme de dispatch pour alertes EMS, Police et Sheriff
-- Notification custom sans bloquer le joueur

local activeAlerts = {}
local activeBlips = {}
local alertIdCounter = 0
local pendingAlerts = {}
local currentAlert = nil

-- Fonction de debug
local function DebugLog(message)
    if Config.Debug then
        print('[Z_Dispatch] ' .. tostring(message))
    end
end

-- Jouer le son d'alerte
local function PlayAlertSound()
    if Config.AlertSound then
        PlaySoundFrontend(-1, 'TIMER_STOP', 'HUD_MINI_GAME_SOUNDSET', true)
    end
end

-- Creer un blip GPS pour l'alerte
local function CreateAlertBlip(coords, alertType, alertTitle)
    local blip = AddBlipForCoord(coords.x, coords.y, coords.z)

    local sprite = Config.BlipSprites[alertType] or Config.BlipSprites.custom
    local color = Config.BlipColors[alertType] or Config.BlipColors.custom

    SetBlipSprite(blip, sprite)
    SetBlipColour(blip, color)
    SetBlipScale(blip, 1.2)
    SetBlipAsShortRange(blip, false)
    SetBlipRoute(blip, true)
    SetBlipRouteColour(blip, color)

    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(alertTitle or 'Alerte')
    EndTextCommandSetBlipName(blip)

    DebugLog('Blip cree pour alerte: ' .. alertTitle)

    return blip
end

-- Supprimer un blip
local function RemoveAlertBlip(alertId)
    if activeBlips[alertId] then
        SetBlipRoute(activeBlips[alertId], false)
        RemoveBlip(activeBlips[alertId])
        activeBlips[alertId] = nil
        DebugLog('Blip supprime pour alerte ID: ' .. alertId)
    end
end

-- Dessiner du texte a l'ecran
local function DrawText3D(text, x, y, scale, r, g, b, a)
    SetTextFont(4)
    SetTextProportional(false)
    SetTextScale(scale, scale)
    SetTextColour(r, g, b, a)
    SetTextDropshadow(0, 0, 0, 0, 255)
    SetTextEdge(2, 0, 0, 0, 150)
    SetTextDropShadow()
    SetTextOutline()
    SetTextRightJustify(true)
    SetTextWrap(0.0, x)
    BeginTextCommandDisplayText('STRING')
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayText(x, y)
end

-- Dessiner un rectangle
local function DrawRect2D(x, y, width, height, r, g, b, a)
    DrawRect(x, y, width, height, r, g, b, a)
end

-- Afficher la notification custom en haut a droite
local function DisplayAlertNotification(alertData, timeRemaining)
    local alertConfig = Config.DefaultAlerts[alertData.type] or Config.DefaultAlerts.custom
    local colors = Config.AlertColors[alertData.type] or Config.AlertColors.custom

    -- Position en haut a droite
    local baseX = 0.85
    local baseY = 0.12
    local width = 0.25
    local height = 0.14

    -- Fond semi-transparent
    DrawRect2D(baseX, baseY, width, height, 0, 0, 0, 180)

    -- Barre de couleur en haut
    DrawRect2D(baseX, baseY - height/2 + 0.008, width, 0.015, colors.r, colors.g, colors.b, 255)

    -- Titre de l'alerte
    DrawText3D(alertConfig.title, baseX + width/2 - 0.01, baseY - height/2 + 0.02, 0.45, colors.r, colors.g, colors.b, 255)

    -- Message
    local message = alertData.message or 'Alerte en cours'
    DrawText3D(message, baseX + width/2 - 0.01, baseY - height/2 + 0.05, 0.35, 255, 255, 255, 255)

    -- Lieu
    if alertData.street then
        DrawText3D('~b~Lieu: ~w~' .. alertData.street, baseX + width/2 - 0.01, baseY - height/2 + 0.075, 0.3, 255, 255, 255, 255)
    end

    -- Info supplementaire
    if alertData.info then
        DrawText3D('~y~Info: ~w~' .. alertData.info, baseX + width/2 - 0.01, baseY - height/2 + 0.095, 0.3, 255, 255, 255, 255)
    end

    -- Instructions touches
    DrawText3D('~g~[Y] Accepter~w~  |  ~r~[X] Refuser', baseX + width/2 - 0.01, baseY + height/2 - 0.025, 0.3, 255, 255, 255, 255)

    -- Barre de temps restant
    local timePercent = timeRemaining / Config.AlertDuration
    local barWidth = width * 0.9 * timePercent
    local barX = baseX - (width * 0.9)/2 + barWidth/2
    DrawRect2D(baseX, baseY + height/2 - 0.008, width * 0.9, 0.008, 50, 50, 50, 200)
    DrawRect2D(barX, baseY + height/2 - 0.008, barWidth, 0.008, colors.r, colors.g, colors.b, 255)
end

-- Accepter l'alerte actuelle
local function AcceptAlert()
    if not currentAlert then return end

    local alertId = currentAlert.id
    local alertData = currentAlert.data
    local alertConfig = Config.DefaultAlerts[alertData.type] or Config.DefaultAlerts.custom

    DebugLog('Alerte acceptee - ID: ' .. alertId)

    -- Creer le blip GPS
    local blip = CreateAlertBlip(alertData.coords, alertData.type, alertConfig.title)
    activeBlips[alertId] = blip
    activeAlerts[alertId] = alertData

    -- Notification de confirmation
    PlaySoundFrontend(-1, 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)

    -- Notifier le serveur
    TriggerServerEvent('Z_Dispatch:alertAccepted', alertId, alertData)

    -- Fermer l'alerte
    currentAlert = nil

    -- Passer a l'alerte suivante si disponible
    if #pendingAlerts > 0 then
        currentAlert = table.remove(pendingAlerts, 1)
        currentAlert.startTime = GetGameTimer()
        PlayAlertSound()
    end

    return alertId
end

-- Refuser l'alerte actuelle
local function RefuseAlert()
    if not currentAlert then return end

    local alertId = currentAlert.id
    local alertData = currentAlert.data

    DebugLog('Alerte refusee - ID: ' .. alertId)

    -- Son de refus
    PlaySoundFrontend(-1, 'CANCEL', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)

    -- Notifier le serveur
    TriggerServerEvent('Z_Dispatch:alertRefused', alertId, alertData)

    -- Fermer l'alerte
    currentAlert = nil

    -- Passer a l'alerte suivante si disponible
    if #pendingAlerts > 0 then
        currentAlert = table.remove(pendingAlerts, 1)
        currentAlert.startTime = GetGameTimer()
        PlayAlertSound()
    end
end

-- Ajouter une nouvelle alerte
local function AddAlert(alertData)
    alertIdCounter = alertIdCounter + 1
    local alertId = alertIdCounter

    DebugLog('Nouvelle alerte recue - ID: ' .. alertId .. ' Type: ' .. alertData.type)

    local alert = {
        id = alertId,
        data = alertData,
        startTime = GetGameTimer()
    }

    -- Si pas d'alerte en cours, afficher celle-ci
    if not currentAlert then
        currentAlert = alert
        PlayAlertSound()
    else
        -- Sinon ajouter a la file d'attente
        table.insert(pendingAlerts, alert)
        DebugLog('Alerte ajoutee a la file d\'attente (position: ' .. #pendingAlerts .. ')')
    end

    return alertId
end

-- Thread principal pour l'affichage et la gestion des touches
CreateThread(function()
    while true do
        if currentAlert then
            local timeElapsed = GetGameTimer() - currentAlert.startTime
            local timeRemaining = Config.AlertDuration - timeElapsed

            if timeRemaining <= 0 then
                -- Alerte expiree
                DebugLog('Alerte expiree - ID: ' .. currentAlert.id)
                TriggerServerEvent('Z_Dispatch:alertExpired', currentAlert.id, currentAlert.data)
                currentAlert = nil

                -- Passer a l'alerte suivante
                if #pendingAlerts > 0 then
                    currentAlert = table.remove(pendingAlerts, 1)
                    currentAlert.startTime = GetGameTimer()
                    PlayAlertSound()
                end
            else
                -- Afficher la notification
                DisplayAlertNotification(currentAlert.data, timeRemaining)

                -- Gerer les touches
                if IsControlJustPressed(0, Config.Keys.accept) then -- Y
                    AcceptAlert()
                elseif IsControlJustPressed(0, Config.Keys.refuse) then -- X
                    RefuseAlert()
                end
            end

            Wait(0)
        else
            Wait(500)
        end
    end
end)

-- Terminer une alerte (supprimer le GPS)
local function EndAlert(alertId)
    if activeAlerts[alertId] then
        RemoveAlertBlip(alertId)
        activeAlerts[alertId] = nil
        DebugLog('Alerte terminee - ID: ' .. alertId)
        return true
    end
    return false
end

-- Supprimer toutes les alertes actives
local function ClearAllAlerts()
    for alertId, _ in pairs(activeBlips) do
        RemoveAlertBlip(alertId)
    end
    activeAlerts = {}
    activeBlips = {}
    currentAlert = nil
    pendingAlerts = {}
    DebugLog('Toutes les alertes ont ete supprimees')
end

-- Obtenir les coordonnees de la rue actuelle
local function GetStreetName(coords)
    local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    local crossingName = GetStreetNameFromHashKey(crossingHash)

    if crossingName and crossingName ~= '' then
        return streetName .. ' / ' .. crossingName
    end
    return streetName
end

-- ============================================
-- EXPORTS - Utilisables depuis d'autres scripts
-- ============================================

-- Export: Envoyer une alerte police
local function SendPoliceAlert(message, coords, info)
    coords = coords or GetEntityCoords(PlayerPedId())
    local street = GetStreetName(coords)

    DebugLog('Export SendPoliceAlert appele')

    TriggerServerEvent('Z_Dispatch:sendAlert', {
        type = 'police',
        message = message,
        coords = coords,
        street = street,
        info = info,
        sender = GetPlayerServerId(PlayerId())
    })
end

-- Export: Envoyer une alerte sheriff
local function SendSheriffAlert(message, coords, info)
    coords = coords or GetEntityCoords(PlayerPedId())
    local street = GetStreetName(coords)

    DebugLog('Export SendSheriffAlert appele')

    TriggerServerEvent('Z_Dispatch:sendAlert', {
        type = 'sheriff',
        message = message,
        coords = coords,
        street = street,
        info = info,
        sender = GetPlayerServerId(PlayerId())
    })
end

-- Export: Envoyer une alerte EMS
local function SendEMSAlert(message, coords, info)
    coords = coords or GetEntityCoords(PlayerPedId())
    local street = GetStreetName(coords)

    DebugLog('Export SendEMSAlert appele')

    TriggerServerEvent('Z_Dispatch:sendAlert', {
        type = 'ems',
        message = message,
        coords = coords,
        street = street,
        info = info,
        sender = GetPlayerServerId(PlayerId())
    })
end

-- Export: Envoyer une alerte custom
local function SendCustomAlert(alertType, title, message, coords, info, targetJobs)
    coords = coords or GetEntityCoords(PlayerPedId())
    local street = GetStreetName(coords)

    DebugLog('Export SendCustomAlert appele - Type: ' .. (alertType or 'custom'))

    TriggerServerEvent('Z_Dispatch:sendAlert', {
        type = alertType or 'custom',
        customTitle = title,
        message = message,
        coords = coords,
        street = street,
        info = info,
        targetJobs = targetJobs,
        sender = GetPlayerServerId(PlayerId())
    })
end

-- Export: Envoyer alerte a tous les services
local function SendAllServicesAlert(message, coords, info)
    coords = coords or GetEntityCoords(PlayerPedId())
    local street = GetStreetName(coords)

    DebugLog('Export SendAllServicesAlert appele')

    TriggerServerEvent('Z_Dispatch:sendAlert', {
        type = 'custom',
        customTitle = 'ALERTE GENERALE',
        message = message,
        coords = coords,
        street = street,
        info = info,
        targetJobs = Config.AuthorizedJobs.all,
        sender = GetPlayerServerId(PlayerId())
    })
end

-- Export: Terminer une alerte active
local function FinishAlert(alertId)
    return EndAlert(alertId)
end

-- Export: Supprimer toutes les alertes
local function ClearAlerts()
    ClearAllAlerts()
end

-- Export: Obtenir les alertes actives
local function GetActiveAlerts()
    return activeAlerts
end

-- Export: Obtenir le nombre d'alertes en attente
local function GetPendingAlertsCount()
    return #pendingAlerts
end

-- Enregistrement des exports
exports('SendPoliceAlert', SendPoliceAlert)
exports('SendSheriffAlert', SendSheriffAlert)
exports('SendEMSAlert', SendEMSAlert)
exports('SendCustomAlert', SendCustomAlert)
exports('SendAllServicesAlert', SendAllServicesAlert)
exports('FinishAlert', FinishAlert)
exports('ClearAlerts', ClearAlerts)
exports('GetActiveAlerts', GetActiveAlerts)
exports('GetPendingAlertsCount', GetPendingAlertsCount)

-- ============================================
-- EVENTS - Reception des alertes
-- ============================================

RegisterNetEvent('Z_Dispatch:receiveAlert', function(alertData)
    DebugLog('Event receiveAlert recu')
    AddAlert(alertData)
end)

RegisterNetEvent('Z_Dispatch:forceEndAlert', function(alertId)
    EndAlert(alertId)
end)

-- ============================================
-- COMMANDES DE TEST (uniquement si Debug = true)
-- ============================================

if Config.Debug then
    -- Commande test alerte police
    RegisterCommand(Config.TestCommands.police, function()
        local coords = GetEntityCoords(PlayerPedId())
        SendPoliceAlert('Vol en cours dans un magasin', coords, 'Suspect arme')
        DebugLog('Commande test police executee')
    end, false)

    -- Commande test alerte sheriff
    RegisterCommand(Config.TestCommands.sheriff, function()
        local coords = GetEntityCoords(PlayerPedId())
        SendSheriffAlert('Signalement de coups de feu', coords, 'Plusieurs temoins')
        DebugLog('Commande test sheriff executee')
    end, false)

    -- Commande test alerte EMS
    RegisterCommand(Config.TestCommands.ems, function()
        local coords = GetEntityCoords(PlayerPedId())
        SendEMSAlert('Personne inconsciente', coords, 'Besoin de soins urgents')
        DebugLog('Commande test EMS executee')
    end, false)

    -- Commande test alerte custom
    RegisterCommand(Config.TestCommands.custom, function()
        local coords = GetEntityCoords(PlayerPedId())
        SendCustomAlert('custom', 'ALERTE TEST', 'Ceci est une alerte de test', coords, 'Test info', {'police', 'ambulance'})
        DebugLog('Commande test custom executee')
    end, false)

    -- Commande pour terminer toutes les alertes
    RegisterCommand('clearalerts', function()
        ClearAllAlerts()
        DebugLog('Toutes les alertes supprimees via commande')
    end, false)

    -- Commande pour tester alerte a tous les services
    RegisterCommand('testalertall', function()
        local coords = GetEntityCoords(PlayerPedId())
        SendAllServicesAlert('Alerte generale de test', coords, 'Tous les services requis')
        DebugLog('Commande test all services executee')
    end, false)

    -- Commande pour voir les alertes en attente
    RegisterCommand('pendingalerts', function()
        print('[Z_Dispatch] Alertes en attente: ' .. #pendingAlerts)
        print('[Z_Dispatch] Alertes actives (GPS): ' .. #activeAlerts)
    end, false)

    DebugLog('Commandes de test enregistrees')
end

-- Nettoyage a la deconnexion
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        ClearAllAlerts()
    end
end)

DebugLog('Z_Dispatch Client charge avec succes')
