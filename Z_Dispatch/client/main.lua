-- Z_Dispatch Client
-- Systeme de dispatch pour alertes EMS, Police et Sheriff

local activeAlerts = {}
local activeBlips = {}
local alertIdCounter = 0

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

-- Afficher l'alerte avec ox_lib
local function ShowAlert(alertData)
    alertIdCounter = alertIdCounter + 1
    local alertId = alertIdCounter

    activeAlerts[alertId] = alertData

    DebugLog('Nouvelle alerte recue - ID: ' .. alertId .. ' Type: ' .. alertData.type)

    PlayAlertSound()

    local alertConfig = Config.DefaultAlerts[alertData.type] or Config.DefaultAlerts.custom

    -- Construire le message de l'alerte
    local description = alertData.message or 'Alerte en cours'
    if alertData.street then
        description = description .. '\n**Lieu:** ' .. alertData.street
    end
    if alertData.info then
        description = description .. '\n**Info:** ' .. alertData.info
    end

    -- Afficher la notification avec boutons via alertDialog
    local alert = lib.alertDialog({
        header = alertConfig.title,
        content = description,
        centered = true,
        cancel = true,
        size = 'md',
        labels = {
            confirm = 'Accepter',
            cancel = 'Refuser'
        }
    })

    if alert == 'confirm' then
        -- Accepter l'alerte : creer le blip GPS
        DebugLog('Alerte acceptee - ID: ' .. alertId)

        local blip = CreateAlertBlip(alertData.coords, alertData.type, alertConfig.title)
        activeBlips[alertId] = blip

        lib.notify({
            title = 'Dispatch',
            description = 'GPS active - En route vers l\'intervention',
            type = 'success',
            duration = 5000
        })

        -- Notifier le serveur
        TriggerServerEvent('Z_Dispatch:alertAccepted', alertId, alertData)

        return alertId
    else
        -- Refuser l'alerte : ne pas creer de GPS
        DebugLog('Alerte refusee - ID: ' .. alertId)

        activeAlerts[alertId] = nil

        lib.notify({
            title = 'Dispatch',
            description = 'Alerte refusee',
            type = 'error',
            duration = 3000
        })

        -- Notifier le serveur
        TriggerServerEvent('Z_Dispatch:alertRefused', alertId, alertData)

        return nil
    end
end

-- Terminer une alerte (supprimer le GPS)
local function EndAlert(alertId)
    if activeAlerts[alertId] then
        RemoveAlertBlip(alertId)
        activeAlerts[alertId] = nil
        DebugLog('Alerte terminee - ID: ' .. alertId)

        lib.notify({
            title = 'Dispatch',
            description = 'Intervention terminee - GPS desactive',
            type = 'info',
            duration = 3000
        })

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

-- Enregistrement des exports
exports('SendPoliceAlert', SendPoliceAlert)
exports('SendSheriffAlert', SendSheriffAlert)
exports('SendEMSAlert', SendEMSAlert)
exports('SendCustomAlert', SendCustomAlert)
exports('SendAllServicesAlert', SendAllServicesAlert)
exports('FinishAlert', FinishAlert)
exports('ClearAlerts', ClearAlerts)
exports('GetActiveAlerts', GetActiveAlerts)

-- ============================================
-- EVENTS - Reception des alertes
-- ============================================

RegisterNetEvent('Z_Dispatch:receiveAlert', function(alertData)
    DebugLog('Event receiveAlert recu')
    ShowAlert(alertData)
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
        lib.notify({
            title = 'Dispatch',
            description = 'Toutes les alertes ont ete supprimees',
            type = 'info'
        })
    end, false)

    -- Commande pour tester alerte a tous les services
    RegisterCommand('testalertall', function()
        local coords = GetEntityCoords(PlayerPedId())
        SendAllServicesAlert('Alerte generale de test', coords, 'Tous les services requis')
        DebugLog('Commande test all services executee')
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
