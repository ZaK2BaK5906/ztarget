ESX = exports['es_extended']:getSharedObject()

-- Variables pour stocker les états
local carryRequests = {}
local hostageRequests = {}

-- Demande de porter un joueur
RegisterNetEvent('ox_target:requestCarry', function(targetId)
    local source = source

    if carryRequests[targetId] then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Ce joueur a déjà une demande en cours',
            type = 'error'
        })
        return
    end

    carryRequests[targetId] = source
    TriggerClientEvent('ox_target:carryRequested', targetId, source)
end)

-- Accepter d'être porté
RegisterNetEvent('ox_target:acceptCarry', function(requesterId)
    local source = source

    if carryRequests[source] == requesterId then
        carryRequests[source] = nil
        TriggerClientEvent('ox_target:startCarrying', requesterId, source)
        TriggerClientEvent('ox_target:startBeingCarried', source, requesterId)
    end
end)

-- Refuser d'être porté
RegisterNetEvent('ox_target:denyCarry', function(requesterId)
    local source = source

    if carryRequests[source] == requesterId then
        carryRequests[source] = nil
        TriggerClientEvent('ox_target:carryDenied', requesterId)
    end
end)

-- Arrêter de porter
RegisterNetEvent('ox_target:stopCarry', function()
    local source = source
    TriggerClientEvent('ox_target:stopBeingCarried', -1)
end)

-- Demande de prise d'otage
RegisterNetEvent('ox_target:requestHostage', function(targetId)
    local source = source

    if hostageRequests[targetId] then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Ce joueur a déjà une demande en cours',
            type = 'error'
        })
        return
    end

    hostageRequests[targetId] = source
    TriggerClientEvent('ox_target:hostageRequested', targetId, source)
end)

-- Accepter d'être pris en otage
RegisterNetEvent('ox_target:acceptHostage', function(requesterId)
    local source = source

    if hostageRequests[source] == requesterId then
        hostageRequests[source] = nil
        TriggerClientEvent('ox_target:startTakingHostage', requesterId, source)
        TriggerClientEvent('ox_target:startBeingHostage', source, requesterId)
    end
end)

-- Refuser d'être pris en otage
RegisterNetEvent('ox_target:denyHostage', function(requesterId)
    local source = source

    if hostageRequests[source] == requesterId then
        hostageRequests[source] = nil
        TriggerClientEvent('ox_target:hostageDenied', requesterId)
    end
end)

-- Arrêter la prise d'otage
RegisterNetEvent('ox_target:stopHostage', function()
    local source = source
    TriggerClientEvent('ox_target:stopBeingHostage', -1)
end)

-- Saluer un joueur
RegisterNetEvent('ox_target:greet', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if xPlayer then
        local playerName = xPlayer.getName()
        TriggerClientEvent('ox_target:receiveGreet', targetId, playerName)
    end
end)

-- Donner de l'argent
RegisterNetEvent('ox_target:giveMoney', function(targetId, amount)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)

    if not xPlayer or not xTarget then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Joueur introuvable',
            type = 'error'
        })
        return
    end

    if amount < Config.MinMoneyAmount or amount > Config.MaxMoneyAmount then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Montant invalide',
            type = 'error'
        })
        return
    end

    if xPlayer.getMoney() < amount then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Vous n\'avez pas assez d\'argent',
            type = 'error'
        })
        return
    end

    xPlayer.removeMoney(amount)
    xTarget.addMoney(amount)

    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Argent donné',
        description = 'Vous avez donné $' .. amount .. ' à ' .. xTarget.getName(),
        type = 'success'
    })

    TriggerClientEvent('ox_lib:notify', targetId, {
        title = 'Argent reçu',
        description = 'Vous avez reçu $' .. amount .. ' de ' .. xPlayer.getName(),
        type = 'success'
    })
end)

-- Serrer la main
RegisterNetEvent('ox_target:handshake', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if xPlayer then
        local playerName = xPlayer.getName()
        TriggerClientEvent('ox_target:receiveHandshake', targetId, playerName)
    end
end)

-- Fouiller un joueur
RegisterNetEvent('ox_target:searchPlayer', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)

    if not xPlayer or not xTarget then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Joueur introuvable',
            type = 'error'
        })
        return
    end

    -- Récupérer l'inventaire du joueur
    local targetInventory = {
        money = xTarget.getMoney(),
        black_money = xTarget.getAccount('black_money').money,
        items = {}
    }

    for _, item in ipairs(xTarget.getInventory()) do
        if item.count > 0 then
            table.insert(targetInventory.items, {
                name = item.name,
                label = item.label,
                count = item.count
            })
        end
    end

    TriggerClientEvent('ox_target:showSearchResult', source, xTarget.getName(), targetInventory)

    -- Notifier le joueur fouillé
    TriggerClientEvent('ox_lib:notify', targetId, {
        title = 'Fouille',
        description = 'Vous êtes en train d\'être fouillé par ' .. xPlayer.getName(),
        type = 'info'
    })
end)

-- Demander les papiers
RegisterNetEvent('ox_target:checkID', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)

    if not xPlayer or not xTarget then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Joueur introuvable',
            type = 'error'
        })
        return
    end

    -- Récupérer les informations du joueur
    MySQL.Async.fetchAll('SELECT firstname, lastname, dateofbirth, sex, height FROM users WHERE identifier = @identifier', {
        ['@identifier'] = xTarget.identifier
    }, function(result)
        if result[1] then
            local playerData = {
                serverId = targetId,
                firstName = result[1].firstname,
                lastName = result[1].lastname,
                dateOfBirth = result[1].dateofbirth,
                sex = result[1].sex,
                height = result[1].height
            }

            TriggerClientEvent('ox_target:showID', source, playerData)

            -- Notifier le joueur
            TriggerClientEvent('ox_lib:notify', targetId, {
                title = 'Contrôle d\'identité',
                description = xPlayer.getName() .. ' vous demande vos papiers',
                type = 'info'
            })
        else
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Erreur',
                description = 'Impossible de récupérer les informations',
                type = 'error'
            })
        end
    end)
end)

-- Menotter un joueur
RegisterNetEvent('ox_target:handcuffPlayer', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)

    if not xPlayer or not xTarget then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Joueur introuvable',
            type = 'error'
        })
        return
    end

    TriggerClientEvent('ox_target:receiveHandcuff', targetId, xPlayer.getName())

    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Menottage',
        description = 'Vous avez menotté ' .. xTarget.getName(),
        type = 'success'
    })
end)

-- Copier l'animation
RegisterNetEvent('ox_target:requestCopyAnim', function(targetId)
    local source = source
    TriggerClientEvent('ox_target:copyAnimRequest', targetId, source)
end)

RegisterNetEvent('ox_target:sendAnimData', function(requesterId, animDict, animName)
    TriggerClientEvent('ox_target:receiveAnimData', requesterId, animDict, animName)
end)

-- Prendre le pouls
RegisterNetEvent('ox_target:checkPulse', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)

    if not xPlayer or not xTarget then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Erreur',
            description = 'Joueur introuvable',
            type = 'error'
        })
        return
    end

    -- Générer un pouls aléatoire réaliste (60-100 BPM)
    local pulse = math.random(60, 100)

    TriggerClientEvent('ox_target:receivePulseCheck', source, pulse)

    TriggerClientEvent('ox_lib:notify', targetId, {
        title = 'Examen médical',
        description = xPlayer.getName() .. ' prend votre pouls',
        type = 'info'
    })
end)

-- Déconnexion : nettoyer les états
AddEventHandler('playerDropped', function()
    local source = source
    carryRequests[source] = nil
    hostageRequests[source] = nil
end)

print('^2[ox_target] Script d\'interactions entre joueurs chargé^0')
