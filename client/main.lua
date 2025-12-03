ESX = exports['es_extended']:getSharedObject()

-- Variables locales pour gérer les états
local isCarrying = false
local isBeingCarried = false
local isHostage = false
local isTakingHostage = false
local carryingPlayer = nil
local carriedPlayer = nil
local hostagePlayer = nil
local hostagedBy = nil
local currentAnim = {dict = nil, name = nil} -- Pour tracker l'animation actuelle

-- Fonction pour charger une animation
local function LoadAnimDict(dict)
    if not HasAnimDictLoaded(dict) then
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Wait(10)
        end
    end
end

-- Fonction pour jouer une animation et la tracker
local function PlayAnimAndTrack(ped, dict, anim, blendIn, blendOut, duration, flag, playbackRate)
    LoadAnimDict(dict)
    TaskPlayAnim(ped, dict, anim, blendIn or 8.0, blendOut or -8.0, duration or -1, flag or 0, playbackRate or 0, false, false, false)
    currentAnim.dict = dict
    currentAnim.name = anim
end

-- Fonction pour obtenir le joueur le plus proche
local function GetClosestPlayer()
    local players = GetActivePlayers()
    local closestDistance = -1
    local closestPlayer = -1
    local ply = PlayerPedId()
    local plyCoords = GetEntityCoords(ply)

    for _, player in ipairs(players) do
        local target = GetPlayerPed(player)
        if target ~= ply then
            local targetCoords = GetEntityCoords(target)
            local distance = #(plyCoords - targetCoords)
            if closestDistance == -1 or distance < closestDistance then
                closestPlayer = player
                closestDistance = distance
            end
        end
    end

    return closestPlayer, closestDistance
end

-- Porter un joueur
local function CarryPlayer(data)
    if isCarrying or isBeingCarried then
        lib.notify({
            title = 'Erreur',
            description = 'Vous êtes déjà en train de porter quelqu\'un ou d\'être porté',
            type = 'error'
        })
        return
    end

    local targetPed = GetPlayerPed(GetPlayerFromServerId(data.serverId))
    local playerPed = PlayerPedId()

    if DoesEntityExist(targetPed) then
        TriggerServerEvent('ox_target:requestCarry', data.serverId)
    end
end

-- Arrêter de porter
local function StopCarrying()
    if isCarrying then
        local playerPed = PlayerPedId()
        ClearPedTasksImmediately(playerPed)
        DetachEntity(playerPed, true, false)

        if DoesEntityExist(carriedPlayer) then
            ClearPedTasksImmediately(carriedPlayer)
            DetachEntity(carriedPlayer, true, false)
        end

        isCarrying = false
        carriedPlayer = nil

        TriggerServerEvent('ox_target:stopCarry')
    elseif isBeingCarried then
        TriggerServerEvent('ox_target:stopCarry')
    end
end

-- Prendre en otage
local function TakeHostage(data)
    if isTakingHostage or isHostage then
        lib.notify({
            title = 'Erreur',
            description = 'Vous êtes déjà en train de prendre quelqu\'un en otage ou d\'être pris en otage',
            type = 'error'
        })
        return
    end

    local targetPed = GetPlayerPed(GetPlayerFromServerId(data.serverId))

    if DoesEntityExist(targetPed) then
        TriggerServerEvent('ox_target:requestHostage', data.serverId)
    end
end

-- Arrêter la prise d'otage
local function StopHostage()
    if isTakingHostage then
        local playerPed = PlayerPedId()
        ClearPedTasksImmediately(playerPed)
        DetachEntity(playerPed, true, false)

        if DoesEntityExist(hostagePlayer) then
            ClearPedTasksImmediately(hostagePlayer)
            DetachEntity(hostagePlayer, true, false)
        end

        isTakingHostage = false
        hostagePlayer = nil

        TriggerServerEvent('ox_target:stopHostage')
    elseif isHostage then
        TriggerServerEvent('ox_target:stopHostage')
    end
end

-- Copier l'animation
local function CopyAnimation(data)
    TriggerServerEvent('ox_target:requestCopyAnim', data.serverId)
end

-- Dire bonjour
local function Greet(data)
    local playerPed = PlayerPedId()
    PlayAnimAndTrack(playerPed, Config.Animations.greet.dict, Config.Animations.greet.anim, 8.0, -8.0, -1, Config.Animations.greet.flag, 0)

    TriggerServerEvent('ox_target:greet', data.serverId)
end

-- Donner de l'argent
local function GiveMoney(data)
    local input = lib.inputDialog('Donner de l\'argent', {
        {
            type = 'number',
            label = 'Montant',
            description = 'Montant à donner (min: ' .. Config.MinMoneyAmount .. ', max: ' .. Config.MaxMoneyAmount .. ')',
            required = true,
            min = Config.MinMoneyAmount,
            max = Config.MaxMoneyAmount
        }
    })

    if input then
        local amount = tonumber(input[1])
        if amount and amount >= Config.MinMoneyAmount and amount <= Config.MaxMoneyAmount then
            TriggerServerEvent('ox_target:giveMoney', data.serverId, amount)
        else
            lib.notify({
                title = 'Erreur',
                description = 'Montant invalide',
                type = 'error'
            })
        end
    end
end

-- Donner un objet
local function GiveItem(data)
    -- Ouvre ton inventaire
    exports.ox_inventory:openInventory('player')
end

-- Serrer la main
local function Handshake(data)
    local playerPed = PlayerPedId()
    PlayAnimAndTrack(playerPed, Config.Animations.handshake.dict, Config.Animations.handshake.anim, 8.0, -8.0, -1, Config.Animations.handshake.flag, 0)

    TriggerServerEvent('ox_target:handshake', data.serverId)

    lib.notify({
        title = 'Poignée de main',
        description = 'Vous serrez la main du joueur',
        type = 'info'
    })
end

-- Fouiller un joueur
local function SearchPlayer(data)
    -- Utiliser l'export de p_policejob pour fouiller
    TriggerEvent('p_policejob/searchPlayer')
end

-- Demander les papiers
local function CheckID(data)
    TriggerServerEvent('ox_target:checkID', data.serverId)
end

-- Menotter
local function HandcuffPlayer(data)
    -- Utiliser l'export de p_policejob pour menotter
    TriggerEvent('p_policejob/tiePlayer')
end

-- Prendre le pouls
local function CheckPulse(data)
    local playerPed = PlayerPedId()
    PlayAnimAndTrack(playerPed, Config.Animations.checkpulse.dict, Config.Animations.checkpulse.anim, 8.0, -8.0, 3000, Config.Animations.checkpulse.flag, 0)

    TriggerServerEvent('ox_target:checkPulse', data.serverId)
end

-- Events client
RegisterNetEvent('ox_target:carryRequested', function(targetId)
    local alert = lib.alertDialog({
        header = 'Demande de transport',
        content = 'Un joueur souhaite vous porter. Acceptez-vous ?',
        centered = true,
        cancel = true,
        labels = {
            confirm = 'Accepter',
            cancel = 'Refuser'
        }
    })

    if alert == 'confirm' then
        TriggerServerEvent('ox_target:acceptCarry', targetId)
    else
        TriggerServerEvent('ox_target:denyCarry', targetId)
    end
end)

RegisterNetEvent('ox_target:startCarrying', function(targetId)
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    local playerPed = PlayerPedId()

    if DoesEntityExist(targetPed) then
        isCarrying = true
        carriedPlayer = targetPed

        LoadAnimDict(Config.Animations.carry.dict)
        TaskPlayAnim(playerPed, Config.Animations.carry.dict, Config.Animations.carry.anim, 8.0, -8.0, -1, Config.Animations.carry.flag, 0, false, false, false)

        lib.notify({
            title = 'Transport',
            description = 'Appuyez sur X pour arrêter de porter le joueur',
            type = 'info'
        })
    end
end)

RegisterNetEvent('ox_target:startBeingCarried', function(carrierId)
    local carrierPed = GetPlayerPed(GetPlayerFromServerId(carrierId))
    local playerPed = PlayerPedId()

    if DoesEntityExist(carrierPed) then
        isBeingCarried = true
        carryingPlayer = carrierPed

        LoadAnimDict(Config.Animations.carried.dict)

        local bone = GetPedBoneIndex(carrierPed, 0) -- Bone 0
        -- Coordonnées exactes de p_ambulancejob
        AttachEntityToEntity(playerPed, carrierPed, bone, 0.25, -0.05, 0.63, 0.25, 0.0, 180.0, false, false, false, false, 2, true)
        TaskPlayAnim(playerPed, Config.Animations.carried.dict, Config.Animations.carried.anim, 8.0, -8.0, -1, Config.Animations.carried.flag, 0, false, false, false)
    end
end)

RegisterNetEvent('ox_target:stopBeingCarried', function()
    local playerPed = PlayerPedId()
    isBeingCarried = false
    carryingPlayer = nil
    ClearPedTasksImmediately(playerPed)
    DetachEntity(playerPed, true, false)
end)

RegisterNetEvent('ox_target:carryDenied', function()
    lib.notify({
        title = 'Refus',
        description = 'Le joueur a refusé d\'être porté',
        type = 'error'
    })
end)

RegisterNetEvent('ox_target:hostageRequested', function(targetId)
    local alert = lib.alertDialog({
        header = 'Prise d\'otage',
        content = 'Un joueur souhaite vous prendre en otage. Acceptez-vous ? (RP)',
        centered = true,
        cancel = true,
        labels = {
            confirm = 'Accepter',
            cancel = 'Refuser'
        }
    })

    if alert == 'confirm' then
        TriggerServerEvent('ox_target:acceptHostage', targetId)
    else
        TriggerServerEvent('ox_target:denyHostage', targetId)
    end
end)

RegisterNetEvent('ox_target:startTakingHostage', function(targetId)
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    local playerPed = PlayerPedId()

    if DoesEntityExist(targetPed) then
        isTakingHostage = true
        hostagePlayer = targetPed

        LoadAnimDict(Config.Animations.hostage_taker.dict)
        TaskPlayAnim(playerPed, Config.Animations.hostage_taker.dict, Config.Animations.hostage_taker.anim, 8.0, -8.0, -1, Config.Animations.hostage_taker.flag, 0, false, false, false)

        lib.notify({
            title = 'Otage',
            description = 'Appuyez sur X pour relâcher l\'otage',
            type = 'info'
        })
    end
end)

RegisterNetEvent('ox_target:startBeingHostage', function(takerId)
    local takerPed = GetPlayerPed(GetPlayerFromServerId(takerId))
    local playerPed = PlayerPedId()

    if DoesEntityExist(takerPed) then
        isHostage = true
        hostagedBy = takerPed

        LoadAnimDict(Config.Animations.hostage.dict)

        local bone = GetPedBoneIndex(takerPed, 0) -- Bone 0
        -- Coordonnées exactes de rpemotes
        AttachEntityToEntity(playerPed, takerPed, bone, -0.3, 0.1, 0.0, 0.0, 0.0, 0.0, false, false, false, false, 2, true)
        TaskPlayAnim(playerPed, Config.Animations.hostage.dict, Config.Animations.hostage.anim, 8.0, -8.0, -1, Config.Animations.hostage.flag, 0, false, false, false)
    end
end)

RegisterNetEvent('ox_target:stopBeingHostage', function()
    local playerPed = PlayerPedId()
    isHostage = false
    hostagedBy = nil
    ClearPedTasksImmediately(playerPed)
    DetachEntity(playerPed, true, false)
end)

RegisterNetEvent('ox_target:hostageDenied', function()
    lib.notify({
        title = 'Refus',
        description = 'Le joueur a refusé d\'être pris en otage',
        type = 'error'
    })
end)

RegisterNetEvent('ox_target:receiveGreet', function(name)
    lib.notify({
        title = 'Salutation',
        description = name .. ' vous salue',
        type = 'info'
    })
end)

RegisterNetEvent('ox_target:receiveHandshake', function(name)
    local playerPed = PlayerPedId()
    PlayAnimAndTrack(playerPed, Config.Animations.handshake.dict, Config.Animations.handshake.anim, 8.0, -8.0, -1, Config.Animations.handshake.flag, 0)

    lib.notify({
        title = 'Poignée de main',
        description = name .. ' vous serre la main',
        type = 'info'
    })
end)

RegisterNetEvent('ox_target:showID', function(playerData)
    lib.registerContext({
        id = 'id_menu',
        title = 'Carte d\'identité',
        options = {
            {label = 'ID: ' .. playerData.serverId},
            {label = 'Nom: ' .. playerData.firstName .. ' ' .. playerData.lastName},
            {label = 'Date de naissance: ' .. playerData.dateOfBirth},
            {label = 'Sexe: ' .. (playerData.sex == 'm' and 'Homme' or 'Femme')},
            {label = 'Taille: ' .. playerData.height .. ' cm'},
        }
    })

    lib.showContext('id_menu')
end)

RegisterNetEvent('ox_target:receivePulseCheck', function(pulse)
    lib.notify({
        title = 'Résultat',
        description = 'Pouls: ' .. pulse .. ' BPM',
        type = 'info'
    })
end)

RegisterNetEvent('ox_target:copyAnimRequest', function(requesterId)
    -- Quelqu'un veut copier mon animation
    if currentAnim.dict and currentAnim.name then
        -- Vérifier si je joue toujours cette animation
        local ped = PlayerPedId()
        if IsEntityPlayingAnim(ped, currentAnim.dict, currentAnim.name, 3) then
            TriggerServerEvent('ox_target:sendAnimData', requesterId, currentAnim.dict, currentAnim.name)
        else
            TriggerServerEvent('ox_target:sendAnimData', requesterId, nil, nil)
        end
    else
        TriggerServerEvent('ox_target:sendAnimData', requesterId, nil, nil)
    end
end)

RegisterNetEvent('ox_target:receiveAnimData', function(animDict, animName)
    if animDict and animName then
        local ped = PlayerPedId()
        PlayAnimAndTrack(ped, animDict, animName, 8.0, -8.0, -1, 0, 0)

        lib.notify({
            title = 'Animation copiée',
            description = 'Vous avez copié l\'animation du joueur',
            type = 'success'
        })
    else
        lib.notify({
            title = 'Erreur',
            description = 'Le joueur n\'effectue aucune animation',
            type = 'error'
        })
    end
end)

-- Contrôles
CreateThread(function()
    while true do
        Wait(0)

        if IsControlJustReleased(0, 73) then -- X key
            if isCarrying or isBeingCarried then
                StopCarrying()
            elseif isTakingHostage or isHostage then
                StopHostage()
            end
        end
    end
end)

-- Initialisation des options ox_target
CreateThread(function()
    Wait(1000) -- Attendre que tout soit chargé

    local options = {}

    -- Porter le joueur
    if Config.EnableCarry then
        table.insert(options, {
            name = 'carry_player',
            label = 'Porter le joueur',
            icon = 'fa-solid fa-person-carry',
            distance = Config.InteractionDistance,
            canInteract = function(entity, distance, coords, name, bone)
                return not isCarrying and not isBeingCarried and not isTakingHostage and not isHostage
            end,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    CarryPlayer({serverId = serverId})
                end
            end
        })
    end

    -- Prendre en otage
    if Config.EnableHostage then
        table.insert(options, {
            name = 'take_hostage',
            label = 'Prendre en otage',
            icon = 'fa-solid fa-user-shield',
            distance = Config.InteractionDistance,
            canInteract = function(entity, distance, coords, name, bone)
                return not isCarrying and not isBeingCarried and not isTakingHostage and not isHostage
            end,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    TakeHostage({serverId = serverId})
                end
            end
        })
    end

    -- Copier l'animation
    if Config.EnableCopyAnim then
        table.insert(options, {
            name = 'copy_animation',
            label = 'Copier l\'animation',
            icon = 'fa-solid fa-copy',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    CopyAnimation({serverId = serverId})
                end
            end
        })
    end

    -- Dire bonjour
    if Config.EnableGreet then
        table.insert(options, {
            name = 'greet_player',
            label = 'Dire bonjour',
            icon = 'fa-solid fa-hand-wave',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    Greet({serverId = serverId})
                end
            end
        })
    end

    -- Donner de l'argent
    if Config.EnableGiveMoney then
        table.insert(options, {
            name = 'give_money',
            label = 'Donner de l\'argent',
            icon = 'fa-solid fa-money-bill',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    GiveMoney({serverId = serverId})
                end
            end
        })
    end

    -- Donner un objet
    if Config.EnableGiveItem then
        table.insert(options, {
            name = 'give_item',
            label = 'Donner un objet',
            icon = 'fa-solid fa-gift',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    GiveItem({serverId = serverId})
                end
            end
        })
    end

    -- Serrer la main
    if Config.EnableHandshake then
        table.insert(options, {
            name = 'handshake',
            label = 'Serrer la main',
            icon = 'fa-solid fa-handshake',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    Handshake({serverId = serverId})
                end
            end
        })
    end

    -- Fouiller (Mains levées uniquement)
    if Config.EnableSearch then
        table.insert(options, {
            name = 'search_player',
            label = 'Fouiller',
            icon = 'fa-solid fa-magnifying-glass',
            distance = Config.InteractionDistance,
            canInteract = function(entity, distance, coords, name, bone)
                -- Vérifier si la cible a les mains levées
                return IsEntityPlayingAnim(entity, 'random@mugging3', 'handsup_standing_base', 3) or
                       IsEntityPlayingAnim(entity, 'missminuteman_1ig_2', 'handsup_base', 3) or
                       IsEntityPlayingAnim(entity, 'mp_am_hold_up', 'handsup_standing_base', 3)
            end,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    SearchPlayer({serverId = serverId})
                end
            end
        })
    end

    -- Demander les papiers
    if Config.EnableCheckID then
        table.insert(options, {
            name = 'check_id',
            label = 'Demander les papiers',
            icon = 'fa-solid fa-id-card',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    CheckID({serverId = serverId})
                end
            end
        })
    end

    -- Menotter
    if Config.EnableHandcuff then
        table.insert(options, {
            name = 'handcuff_player',
            label = 'Menotter',
            icon = 'fa-solid fa-handcuffs',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    HandcuffPlayer({serverId = serverId})
                end
            end
        })
    end

    -- Prendre le pouls
    if Config.EnableCheckPulse then
        table.insert(options, {
            name = 'check_pulse',
            label = 'Prendre le pouls',
            icon = 'fa-solid fa-heartbeat',
            distance = Config.InteractionDistance,
            onSelect = function(data)
                local targetPlayer = NetworkGetPlayerIndexFromPed(data.entity)
                if targetPlayer ~= -1 then
                    local serverId = GetPlayerServerId(targetPlayer)
                    CheckPulse({serverId = serverId})
                end
            end
        })
    end

    -- Ajouter toutes les options aux joueurs
    exports.ox_target:addGlobalPlayer(options)

    print('[ox_target] ' .. #options .. ' interactions entre joueurs chargées')
end)
