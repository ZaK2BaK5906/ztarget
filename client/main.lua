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

-- Fonction pour charger une animation
local function LoadAnimDict(dict)
    if not HasAnimDictLoaded(dict) then
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Wait(10)
        end
    end
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
    local targetPed = GetPlayerPed(GetPlayerFromServerId(data.serverId))

    if DoesEntityExist(targetPed) then
        if IsEntityPlayingAnim(targetPed, GetEntityAnimCurrentName(targetPed, 0), GetEntityAnimCurrentName(targetPed, 1), 3) then
            local animDict = GetEntityAnimCurrentName(targetPed, 0)
            local animName = GetEntityAnimCurrentName(targetPed, 1)

            if animDict and animName and animDict ~= '' and animName ~= '' then
                LoadAnimDict(animDict)
                TaskPlayAnim(PlayerPedId(), animDict, animName, 8.0, -8.0, -1, 0, 0, false, false, false)

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
        else
            lib.notify({
                title = 'Erreur',
                description = 'Le joueur n\'effectue aucune animation',
                type = 'error'
            })
        end
    end
end

-- Dire bonjour
local function Greet(data)
    local playerPed = PlayerPedId()
    LoadAnimDict(Config.Animations.greet.dict)
    TaskPlayAnim(playerPed, Config.Animations.greet.dict, Config.Animations.greet.anim, 8.0, -8.0, -1, Config.Animations.greet.flag, 0, false, false, false)

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
    -- Ouvre simplement ton inventaire pour que tu puisses donner un objet
    ExecuteCommand('inventory')
end

-- Serrer la main
local function Handshake(data)
    local playerPed = PlayerPedId()
    LoadAnimDict(Config.Animations.handshake.dict)
    TaskPlayAnim(playerPed, Config.Animations.handshake.dict, Config.Animations.handshake.anim, 8.0, -8.0, -1, Config.Animations.handshake.flag, 0, false, false, false)

    TriggerServerEvent('ox_target:handshake', data.serverId)

    lib.notify({
        title = 'Poignée de main',
        description = 'Vous serrez la main du joueur',
        type = 'info'
    })
end

-- Fouiller un joueur (Police uniquement)
local function SearchPlayer(data)
    TriggerServerEvent('ox_target:searchPlayer', data.serverId)
end

-- Demander les papiers
local function CheckID(data)
    TriggerServerEvent('ox_target:checkID', data.serverId)
end

-- Menotter (Police uniquement)
local function HandcuffPlayer(data)
    TriggerServerEvent('ox_target:handcuffPlayer', data.serverId)
end

-- Prendre le pouls (Médecin uniquement)
local function CheckPulse(data)
    local playerPed = PlayerPedId()
    LoadAnimDict(Config.Animations.checkpulse.dict)
    TaskPlayAnim(playerPed, Config.Animations.checkpulse.dict, Config.Animations.checkpulse.anim, 8.0, -8.0, 3000, Config.Animations.checkpulse.flag, 0, false, false, false)

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

        local bone = GetPedBoneIndex(carrierPed, 11816) -- SKEL_Spine3
        AttachEntityToEntity(playerPed, carrierPed, bone, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, false, false, true, false, 2, true)
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

        local bone = GetPedBoneIndex(takerPed, 11816) -- SKEL_Spine3
        AttachEntityToEntity(playerPed, takerPed, bone, 0.0, 0.45, 0.0, 0.0, 0.0, 0.0, false, false, true, false, 2, true)
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
    LoadAnimDict(Config.Animations.handshake.dict)
    TaskPlayAnim(playerPed, Config.Animations.handshake.dict, Config.Animations.handshake.anim, 8.0, -8.0, -1, Config.Animations.handshake.flag, 0, false, false, false)

    lib.notify({
        title = 'Poignée de main',
        description = name .. ' vous serre la main',
        type = 'info'
    })
end)

RegisterNetEvent('ox_target:showSearchResult', function(playerName, inventory)
    local elements = {}

    if inventory.money > 0 then
        table.insert(elements, {label = 'Argent: $' .. inventory.money})
    end

    if inventory.black_money > 0 then
        table.insert(elements, {label = 'Argent sale: $' .. inventory.black_money})
    end

    if #inventory.items > 0 then
        for _, item in ipairs(inventory.items) do
            table.insert(elements, {label = item.label .. ' x' .. item.count})
        end
    end

    if #elements == 0 then
        table.insert(elements, {label = 'Rien trouvé'})
    end

    lib.registerContext({
        id = 'search_menu',
        title = 'Fouille: ' .. playerName,
        options = elements
    })

    lib.showContext('search_menu')
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

RegisterNetEvent('ox_target:receiveHandcuff', function(name)
    local playerPed = PlayerPedId()
    LoadAnimDict(Config.Animations.handcuff.dict)
    TaskPlayAnim(playerPed, Config.Animations.handcuff.dict, Config.Animations.handcuff.anim, 8.0, -8.0, -1, Config.Animations.handcuff.flag, 0, false, false, false)

    lib.notify({
        title = 'Menottage',
        description = 'Vous avez été menotté par ' .. name,
        type = 'warning'
    })
end)

RegisterNetEvent('ox_target:receivePulseCheck', function(pulse)
    lib.notify({
        title = 'Résultat',
        description = 'Pouls: ' .. pulse .. ' BPM',
        type = 'info'
    })
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
