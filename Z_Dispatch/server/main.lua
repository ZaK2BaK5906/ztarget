-- Z_Dispatch Server
-- Systeme de dispatch pour alertes EMS, Police et Sheriff

local alertHistory = {}
local alertIdCounter = 0

-- Fonction de debug
local function DebugLog(message)
    if Config.Debug then
        print('[Z_Dispatch] ' .. tostring(message))
    end
end

-- Verifier si un joueur a un job autorise
local function PlayerHasJob(source, authorizedJobs)
    local xPlayer = exports['es_extended']:getSharedObject().GetPlayerFromId(source)

    if not xPlayer then
        DebugLog('Joueur non trouve: ' .. source)
        return false
    end

    local playerJob = xPlayer.getJob().name

    for _, job in ipairs(authorizedJobs) do
        if playerJob == job then
            DebugLog('Joueur ' .. source .. ' a le job autorise: ' .. playerJob)
            return true
        end
    end

    DebugLog('Joueur ' .. source .. ' n\'a pas de job autorise (job: ' .. playerJob .. ')')
    return false
end

-- Obtenir tous les joueurs avec un job specifique
local function GetPlayersWithJobs(authorizedJobs)
    local players = {}
    local allPlayers = GetPlayers()

    for _, playerId in ipairs(allPlayers) do
        local source = tonumber(playerId)
        if PlayerHasJob(source, authorizedJobs) then
            table.insert(players, source)
        end
    end

    DebugLog('Joueurs trouves avec jobs autorises: ' .. #players)
    return players
end

-- Envoyer une alerte aux joueurs cibles
local function DispatchAlert(alertData)
    alertIdCounter = alertIdCounter + 1
    local alertId = alertIdCounter

    -- Determiner les jobs cibles
    local targetJobs = alertData.targetJobs

    if not targetJobs then
        if alertData.type == 'police' then
            targetJobs = Config.AuthorizedJobs.police
        elseif alertData.type == 'sheriff' then
            targetJobs = Config.AuthorizedJobs.sheriff
        elseif alertData.type == 'ems' then
            targetJobs = Config.AuthorizedJobs.ems
        else
            targetJobs = Config.AuthorizedJobs.all
        end
    end

    -- Trouver les joueurs cibles
    local targetPlayers = GetPlayersWithJobs(targetJobs)

    if #targetPlayers == 0 then
        DebugLog('Aucun joueur disponible pour l\'alerte ID: ' .. alertId)
        return nil
    end

    -- Sauvegarder dans l'historique
    alertHistory[alertId] = {
        data = alertData,
        timestamp = os.time(),
        acceptedBy = {},
        refusedBy = {}
    }

    -- Envoyer l'alerte a tous les joueurs cibles
    for _, playerId in ipairs(targetPlayers) do
        TriggerClientEvent('Z_Dispatch:receiveAlert', playerId, alertData)
        DebugLog('Alerte envoyee au joueur: ' .. playerId)
    end

    DebugLog('Alerte ID ' .. alertId .. ' envoyee a ' .. #targetPlayers .. ' joueurs')

    return alertId
end

-- ============================================
-- EXPORTS SERVEUR
-- ============================================

-- Export: Envoyer une alerte police depuis le serveur
local function SendPoliceAlertServer(message, coords, info, senderSource)
    DebugLog('Export serveur SendPoliceAlert appele')

    return DispatchAlert({
        type = 'police',
        message = message,
        coords = coords,
        info = info,
        sender = senderSource or 0
    })
end

-- Export: Envoyer une alerte sheriff depuis le serveur
local function SendSheriffAlertServer(message, coords, info, senderSource)
    DebugLog('Export serveur SendSheriffAlert appele')

    return DispatchAlert({
        type = 'sheriff',
        message = message,
        coords = coords,
        info = info,
        sender = senderSource or 0
    })
end

-- Export: Envoyer une alerte EMS depuis le serveur
local function SendEMSAlertServer(message, coords, info, senderSource)
    DebugLog('Export serveur SendEMSAlert appele')

    return DispatchAlert({
        type = 'ems',
        message = message,
        coords = coords,
        info = info,
        sender = senderSource or 0
    })
end

-- Export: Envoyer une alerte custom depuis le serveur
local function SendCustomAlertServer(alertType, title, message, coords, info, targetJobs, senderSource)
    DebugLog('Export serveur SendCustomAlert appele')

    return DispatchAlert({
        type = alertType or 'custom',
        customTitle = title,
        message = message,
        coords = coords,
        info = info,
        targetJobs = targetJobs,
        sender = senderSource or 0
    })
end

-- Export: Envoyer alerte a un joueur specifique
local function SendAlertToPlayer(playerId, alertData)
    DebugLog('Export serveur SendAlertToPlayer appele - Joueur: ' .. playerId)
    TriggerClientEvent('Z_Dispatch:receiveAlert', playerId, alertData)
end

-- Export: Envoyer alerte a tous les services
local function SendAllServicesAlertServer(message, coords, info, senderSource)
    DebugLog('Export serveur SendAllServicesAlert appele')

    return DispatchAlert({
        type = 'custom',
        customTitle = 'ALERTE GENERALE',
        message = message,
        coords = coords,
        info = info,
        targetJobs = Config.AuthorizedJobs.all,
        sender = senderSource or 0
    })
end

-- Export: Obtenir l'historique des alertes
local function GetAlertHistory()
    return alertHistory
end

-- Export: Forcer la fin d'une alerte pour un joueur
local function ForceEndAlert(playerId, alertId)
    TriggerClientEvent('Z_Dispatch:forceEndAlert', playerId, alertId)
end

-- Enregistrement des exports serveur
exports('SendPoliceAlert', SendPoliceAlertServer)
exports('SendSheriffAlert', SendSheriffAlertServer)
exports('SendEMSAlert', SendEMSAlertServer)
exports('SendCustomAlert', SendCustomAlertServer)
exports('SendAlertToPlayer', SendAlertToPlayer)
exports('SendAllServicesAlert', SendAllServicesAlertServer)
exports('GetAlertHistory', GetAlertHistory)
exports('ForceEndAlert', ForceEndAlert)

-- ============================================
-- EVENTS
-- ============================================

-- Reception d'une alerte depuis un client
RegisterNetEvent('Z_Dispatch:sendAlert', function(alertData)
    local source = source
    DebugLog('Alerte recue du joueur ' .. source)

    -- Ajouter les coordonnees de rue si manquantes
    if not alertData.street then
        alertData.street = 'Position inconnue'
    end

    DispatchAlert(alertData)
end)

-- Alerte acceptee par un joueur
RegisterNetEvent('Z_Dispatch:alertAccepted', function(alertId, alertData, isInVehicle)
    local source = source
    DebugLog('Alerte ' .. alertId .. ' acceptee par joueur ' .. source)

    if alertHistory[alertId] then
        table.insert(alertHistory[alertId].acceptedBy, source)
    end

    -- Partager le GPS avec les autres occupants du vehicule
    if isInVehicle then
        local ped = GetPlayerPed(source)
        local vehicle = GetVehiclePedIsIn(ped, false)

        if vehicle and vehicle ~= 0 then
            -- Trouver tous les occupants du vehicule
            for seat = -1, 5 do -- -1 = conducteur, 0-5 = passagers
                local seatPed = GetPedInVehicleSeat(vehicle, seat)
                if seatPed and seatPed ~= 0 and seatPed ~= ped then
                    local playerId = NetworkGetEntityOwner(seatPed)
                    -- Verifier que c'est bien un joueur
                    if playerId and playerId > 0 and playerId ~= source then
                        DebugLog('Partage GPS avec passager: ' .. playerId)
                        TriggerClientEvent('Z_Dispatch:shareGPS', playerId, alertId, alertData)
                    end
                end
            end
        end
    end
end)

-- Alerte refusee par un joueur
RegisterNetEvent('Z_Dispatch:alertRefused', function(alertId, alertData)
    local source = source
    DebugLog('Alerte ' .. alertId .. ' refusee par joueur ' .. source)

    if alertHistory[alertId] then
        table.insert(alertHistory[alertId].refusedBy, source)
    end
end)

-- ============================================
-- COMMANDES ADMIN (uniquement si Debug = true)
-- ============================================

if Config.Debug then
    -- Commande pour voir l'historique des alertes
    RegisterCommand('alerthistory', function(source, args)
        local count = 0
        for id, alert in pairs(alertHistory) do
            count = count + 1
            print('[Z_Dispatch] Alerte #' .. id .. ' - Type: ' .. (alert.data.type or 'unknown') .. ' - Acceptees: ' .. #alert.acceptedBy .. ' - Refusees: ' .. #alert.refusedBy)
        end
        print('[Z_Dispatch] Total alertes: ' .. count)
    end, true)

    -- Commande pour clear l'historique
    RegisterCommand('clearalerthistory', function(source, args)
        alertHistory = {}
        alertIdCounter = 0
        print('[Z_Dispatch] Historique des alertes efface')
    end, true)

    DebugLog('Commandes admin enregistrees')
end

-- Nettoyage periodique de l'historique (alertes de plus de 1 heure)
CreateThread(function()
    while true do
        Wait(300000) -- 5 minutes

        local currentTime = os.time()
        local removed = 0

        for alertId, alert in pairs(alertHistory) do
            if currentTime - alert.timestamp > 3600 then -- 1 heure
                alertHistory[alertId] = nil
                removed = removed + 1
            end
        end

        if removed > 0 then
            DebugLog('Nettoyage: ' .. removed .. ' alertes anciennes supprimees')
        end
    end
end)

DebugLog('Z_Dispatch Server charge avec succes')
