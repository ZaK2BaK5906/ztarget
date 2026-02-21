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

-- Dessiner du texte centre
local function DrawTextUI(text, x, y, scale, r, g, b, a, centered, font)
    SetTextFont(font or 4)
    SetTextProportional(false)
    SetTextScale(scale, scale)
    SetTextColour(r, g, b, a)
    SetTextDropshadow(0, 0, 0, 0, 255)
    SetTextEdge(1, 0, 0, 0, 200)
    SetTextDropShadow()
    if centered then
        SetTextCentre(true)
    end
    BeginTextCommandDisplayText('STRING')
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayText(x, y)
end

-- Dessiner un rectangle
local function DrawRect2D(x, y, width, height, r, g, b, a)
    DrawRect(x, y, width, height, r, g, b, a)
end

-- Afficher la notification custom en haut a droite - UI MODERNE
local function DisplayAlertNotification(alertData, timeRemaining)
    local alertConfig = Config.DefaultAlerts[alertData.type] or Config.DefaultAlerts.custom
    local colors = Config.AlertColors[alertData.type] or Config.AlertColors.custom

    -- Position en haut a droite
    local baseX = 0.855
    local baseY = 0.155
    local width = 0.23
    local height = 0.17

    -- Ombre portee
    DrawRect2D(baseX + 0.003, baseY + 0.004, width, height, 0, 0, 0, 120)

    -- Fond principal gradient effect (plusieurs couches)
    DrawRect2D(baseX, baseY, width, height, 15, 15, 20, 240)
    DrawRect2D(baseX, baseY, width, height - 0.002, 25, 25, 35, 220)

    -- Bordure gauche coloree (accent)
    DrawRect2D(baseX - width/2 + 0.003, baseY, 0.006, height, colors.r, colors.g, colors.b, 255)

    -- Header avec icone type
    local headerY = baseY - height/2 + 0.025
    DrawRect2D(baseX, headerY, width - 0.01, 0.035, colors.r, colors.g, colors.b, 40)

    -- Icone dispatch (cercle)
    DrawRect2D(baseX - width/2 + 0.025, headerY, 0.015, 0.025, colors.r, colors.g, colors.b, 255)

    -- Titre
    DrawTextUI(alertConfig.title, baseX - width/2 + 0.045, headerY - 0.012, 0.38, colors.r, colors.g, colors.b, 255, false, 4)

    -- Separateur
    DrawRect2D(baseX, baseY - height/2 + 0.048, width - 0.02, 0.001, 255, 255, 255, 30)

    -- Message principal
    local message = alertData.message or 'Alerte en cours'
    DrawTextUI(message, baseX, baseY - height/2 + 0.062, 0.33, 255, 255, 255, 255, true, 4)

    -- Lieu avec icone
    if alertData.street then
        DrawRect2D(baseX - width/2 + 0.022, baseY - height/2 + 0.088, 0.008, 0.012, 100, 180, 255, 255)
        DrawTextUI(alertData.street, baseX - width/2 + 0.035, baseY - height/2 + 0.08, 0.28, 180, 200, 255, 255, false, 4)
    end

    -- Info supplementaire
    if alertData.info then
        DrawRect2D(baseX - width/2 + 0.022, baseY - height/2 + 0.108, 0.008, 0.012, 255, 200, 100, 255)
        DrawTextUI(alertData.info, baseX - width/2 + 0.035, baseY - height/2 + 0.10, 0.28, 255, 220, 150, 255, false, 4)
    end

    -- Separateur avant boutons
    DrawRect2D(baseX, baseY + height/2 - 0.045, width - 0.02, 0.001, 255, 255, 255, 30)

    -- Boutons stylises
    local btnWidth = 0.085
    local btnHeight = 0.028
    local btnY = baseY + height/2 - 0.028

    -- Bouton Accepter (vert)
    local acceptX = baseX - 0.05
    DrawRect2D(acceptX, btnY, btnWidth, btnHeight, 40, 167, 69, 220)
    DrawRect2D(acceptX, btnY - btnHeight/2 + 0.002, btnWidth, 0.004, 60, 200, 90, 255)
    DrawTextUI("[Y] ACCEPTER", acceptX, btnY - 0.009, 0.26, 255, 255, 255, 255, true, 4)

    -- Bouton Refuser (rouge)
    local refuseX = baseX + 0.05
    DrawRect2D(refuseX, btnY, btnWidth, btnHeight, 180, 50, 50, 220)
    DrawRect2D(refuseX, btnY - btnHeight/2 + 0.002, btnWidth, 0.004, 220, 70, 70, 255)
    DrawTextUI("[X] REFUSER", refuseX, btnY - 0.009, 0.26, 255, 255, 255, 255, true, 4)

    -- Barre de progression en bas
    local timePercent = timeRemaining / Config.AlertDuration
    local barFullWidth = width - 0.01
    local barHeight = 0.006
    local barY = baseY + height/2 - 0.003

    -- Fond de la barre
    DrawRect2D(baseX, barY, barFullWidth, barHeight, 40, 40, 50, 200)

    -- Barre de progression (se vide de droite a gauche)
    local barWidth = barFullWidth * timePercent
    local barX = baseX - barFullWidth/2 + barWidth/2
    DrawRect2D(barX, barY, barWidth, barHeight, colors.r, colors.g, colors.b, 255)

    -- Effet de brillance sur la barre
    DrawRect2D(barX, barY - barHeight/2 + 0.001, barWidth, 0.002, 255, 255, 255, 60)
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

    -- Notifier le serveur (+ partager avec l'equipage du vehicule)
    local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
    TriggerServerEvent('Z_Dispatch:alertAccepted', alertId, alertData, vehicle ~= 0)

    -- Timer pour supprimer le blip automatiquement
    if Config.BlipDuration and Config.BlipDuration > 0 then
        SetTimeout(Config.BlipDuration * 1000, function()
            if activeBlips[alertId] then
                DebugLog('Blip expire automatiquement - ID: ' .. alertId)
                RemoveAlertBlip(alertId)
                activeAlerts[alertId] = nil
            end
        end)
    end

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

-- ============================================
-- EXPORT: ALERTE VEHICULE AVEC DETAILS
-- ============================================

-- Obtenir la couleur du vehicule en texte
local function GetVehicleColorName(vehicle)
    local colorPrimary, colorSecondary = GetVehicleColours(vehicle)
    return Config.VehicleColors[colorPrimary] or ('Couleur #' .. colorPrimary)
end

-- Obtenir le nom du modele du vehicule
local function GetVehicleModelName(vehicle)
    local model = GetEntityModel(vehicle)
    local displayName = GetDisplayNameFromVehicleModel(model)
    local labelName = GetLabelText(displayName)

    if labelName == 'NULL' or labelName == '' then
        return displayName
    end
    return labelName
end

-- Export: Envoyer une alerte vehicule avec details
local function SendVehicleAlert(message, vehicle, coords, extraInfo)
    if not Config.VehicleAlert.enabled then return end

    vehicle = vehicle or GetVehiclePedIsIn(PlayerPedId(), false)
    coords = coords or GetEntityCoords(vehicle ~= 0 and vehicle or PlayerPedId())
    local street = GetStreetName(coords)

    local info = ''

    if vehicle and vehicle ~= 0 then
        -- Modele
        if Config.VehicleAlert.showModel then
            local modelName = GetVehicleModelName(vehicle)
            info = info .. 'Modele: ' .. modelName
        end

        -- Plaque
        if Config.VehicleAlert.showPlate then
            local plate = GetVehicleNumberPlateText(vehicle)
            if plate then
                info = info .. ' | Plaque: ' .. plate:gsub('%s+', '')
            end
        end

        -- Couleur
        if Config.VehicleAlert.showColor then
            local color = GetVehicleColorName(vehicle)
            info = info .. ' | ' .. color
        end
    end

    -- Ajouter info supplementaire
    if extraInfo then
        info = info .. ' | ' .. extraInfo
    end

    DebugLog('Export SendVehicleAlert appele - Info: ' .. info)

    TriggerServerEvent('Z_Dispatch:sendAlert', {
        type = 'police',
        message = message or Config.VehicleAlert.alertTitle,
        coords = coords,
        street = street,
        info = info,
        sender = GetPlayerServerId(PlayerId())
    })
end

-- Export: Alerte vehicule simple (juste le vehicule du joueur)
local function SendMyVehicleAlert(message)
    local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
    if vehicle == 0 then
        vehicle = GetVehiclePedIsIn(PlayerPedId(), true) -- Dernier vehicule
    end
    SendVehicleAlert(message, vehicle)
end

-- ============================================
-- SYSTEME D'ALERTE DE TIR AUTOMATIQUE
-- ============================================

local lastGunShotAlert = 0
local gunShotCooldown = (Config.GunShot and Config.GunShot.cooldown or 30) * 1000

-- Verifier si le joueur a un job exclu
local function IsJobExcluded()
    if not Config.GunShot or not Config.GunShot.excludeJobs then return false end

    local ESX = exports['es_extended']:getSharedObject()
    local playerData = ESX.GetPlayerData()

    if playerData and playerData.job then
        for _, job in ipairs(Config.GunShot.excludeJobs) do
            if playerData.job.name == job then
                return true
            end
        end
    end
    return false
end

-- Thread de detection des tirs
CreateThread(function()
    if not Config.GunShot or not Config.GunShot.enabled then
        DebugLog('Systeme d\'alerte de tir desactive')
        return
    end

    DebugLog('Systeme d\'alerte de tir actif')

    while true do
        Wait(Config.GunShot.checkInterval or 500)

        local ped = PlayerPedId()

        -- Verifier si le joueur tire
        if IsPedShooting(ped) then
            local currentTime = GetGameTimer()

            -- Verifier cooldown et job
            if currentTime - lastGunShotAlert > gunShotCooldown and not IsJobExcluded() then
                lastGunShotAlert = currentTime

                local coords = GetEntityCoords(ped)
                local street = GetStreetName(coords)

                -- Verifier si dans un vehicule pour ajouter les infos
                local vehicle = GetVehiclePedIsIn(ped, false)
                local info = Config.GunShot.alertInfo

                if vehicle ~= 0 then
                    local modelName = GetVehicleModelName(vehicle)
                    local plate = GetVehicleNumberPlateText(vehicle)
                    local color = GetVehicleColorName(vehicle)
                    info = modelName .. ' | ' .. color .. ' | ' .. plate:gsub('%s+', '')
                end

                DebugLog('Alerte de tir declenchee')

                TriggerServerEvent('Z_Dispatch:sendAlert', {
                    type = 'police',
                    message = Config.GunShot.alertTitle,
                    coords = coords,
                    street = street,
                    info = info,
                    sender = GetPlayerServerId(PlayerId())
                })
            end
        end
    end
end)

-- Enregistrement des exports
exports('SendPoliceAlert', SendPoliceAlert)
exports('SendSheriffAlert', SendSheriffAlert)
exports('SendEMSAlert', SendEMSAlert)
exports('SendCustomAlert', SendCustomAlert)
exports('SendAllServicesAlert', SendAllServicesAlert)
exports('SendVehicleAlert', SendVehicleAlert)
exports('SendMyVehicleAlert', SendMyVehicleAlert)
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

-- Recevoir un GPS partage par un coequipier
RegisterNetEvent('Z_Dispatch:shareGPS', function(alertId, alertData)
    -- Verifier qu'on n'a pas deja ce blip
    if activeBlips[alertId] then
        DebugLog('GPS deja actif pour alerte ID: ' .. alertId)
        return
    end

    local alertConfig = Config.DefaultAlerts[alertData.type] or Config.DefaultAlerts.custom

    DebugLog('GPS partage recu - ID: ' .. alertId)

    -- Creer le blip GPS
    local blip = CreateAlertBlip(alertData.coords, alertData.type, alertConfig.title)
    activeBlips[alertId] = blip
    activeAlerts[alertId] = alertData

    -- Son de confirmation
    PlaySoundFrontend(-1, 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)

    -- Timer pour supprimer le blip automatiquement
    if Config.BlipDuration and Config.BlipDuration > 0 then
        SetTimeout(Config.BlipDuration * 1000, function()
            if activeBlips[alertId] then
                RemoveAlertBlip(alertId)
                activeAlerts[alertId] = nil
            end
        end)
    end
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

    -- Commande test alerte vehicule
    RegisterCommand('testalertvehicle', function()
        local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
        if vehicle == 0 then
            print('[Z_Dispatch] Tu dois etre dans un vehicule !')
            return
        end
        SendVehicleAlert('Vehicule suspect signale', vehicle)
        DebugLog('Commande test vehicule executee')
    end, false)

    -- Commande pour tester l'alerte de tir manuellement
    RegisterCommand('testalertgunshot', function()
        local coords = GetEntityCoords(PlayerPedId())
        local street = GetStreetName(coords)
        TriggerServerEvent('Z_Dispatch:sendAlert', {
            type = 'police',
            message = Config.GunShot.alertTitle,
            coords = coords,
            street = street,
            info = 'Test manuel - ' .. Config.GunShot.alertInfo,
            sender = GetPlayerServerId(PlayerId())
        })
        DebugLog('Commande test gunshot executee')
    end, false)

    DebugLog('Commandes de test enregistrees')
end

-- ============================================
-- COMMANDE FIN INTERVENTION (toujours active)
-- ============================================

-- Commande pour finir l'intervention et supprimer le GPS
RegisterCommand('finintervention', function()
    local count = 0
    for alertId, _ in pairs(activeBlips) do
        RemoveAlertBlip(alertId)
        activeAlerts[alertId] = nil
        count = count + 1
    end

    if count > 0 then
        PlaySoundFrontend(-1, 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
        DebugLog('Interventions terminees: ' .. count)
    end
end, false)

-- Alias court
RegisterCommand('fin', function()
    ExecuteCommand('finintervention')
end, false)

-- Nettoyage a la deconnexion
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        ClearAllAlerts()
    end
end)

DebugLog('Z_Dispatch Client charge avec succes')
