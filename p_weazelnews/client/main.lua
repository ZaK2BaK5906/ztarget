-- Variables locales
local ESX = exports['es_extended']:getSharedObject()
local PlayerData = {}
local isReporter = false

-- Props actifs
local activeMic = nil
local activeCamera = nil
local activeNewspaper = nil

-- Etats
local isMicOut = false
local isCameraActive = false
local isReadingNewspaper = false
local isWritingArticle = false
local cameraOverlayActive = false

-- Cache pour les articles
local cachedArticles = {}
local currentArticleIndex = 1

-- Blips pour les vendeurs (a supprimer quand on quitte le job)
local vendorBlips = {}

-- Configuration overlay personnalisee (peut etre changee par le patron)
local overlayConfig = {
    title = Config.CameraOverlay.defaultTitle,
    subtitle = Config.CameraOverlay.defaultSubtitle,
    ticker = Config.CameraOverlay.defaultTicker,
    showDateTime = Config.CameraOverlay.showDateTime,
    showLiveBadge = Config.CameraOverlay.showLiveBadge,
    showRecIndicator = Config.CameraOverlay.showRecIndicator,
    showTicker = Config.CameraOverlay.showTicker,
    showCorners = Config.CameraOverlay.showCorners
}

-- =====================================
-- FONCTIONS UTILITAIRES
-- =====================================

local function LoadAnimDict(dict)
    if not HasAnimDictLoaded(dict) then
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Wait(10)
        end
    end
end

local function LoadModel(model)
    local hash = type(model) == 'string' and GetHashKey(model) or model
    if not HasModelLoaded(hash) then
        RequestModel(hash)
        while not HasModelLoaded(hash) do
            Wait(10)
        end
    end
    return hash
end

local function Notify(message, type)
    lib.notify({
        title = Config.JobLabel,
        description = message,
        type = type or 'info',
        duration = 5000
    })
end

local function HasReporterJob()
    if not PlayerData.job then return false end
    return PlayerData.job.name == Config.JobName
end

local function CanConfigureOverlay()
    if not PlayerData.job then return false end
    if PlayerData.job.name ~= Config.JobName then return false end
    return PlayerData.job.grade >= Config.MinGradeForOverlayConfig
end

-- =====================================
-- GESTION DES BLIPS VENDEURS (JOB ONLY)
-- =====================================

local function CreateVendorBlips()
    -- Supprimer les anciens blips
    for _, blip in ipairs(vendorBlips) do
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end
    vendorBlips = {}

    -- Creer les blips seulement si reporter
    if isReporter then
        for i, vendor in ipairs(Config.NewspaperVendors) do
            local blip = AddBlipForCoord(vendor.coords.x, vendor.coords.y, vendor.coords.z)
            SetBlipSprite(blip, Config.Blips.vendorSprite)
            SetBlipDisplay(blip, 4)
            SetBlipScale(blip, Config.Blips.scale)
            SetBlipColour(blip, Config.Blips.vendorColor)
            SetBlipAsShortRange(blip, true)
            BeginTextCommandSetBlipName('STRING')
            AddTextEntry('weazelnews_vendor_' .. i, vendor.label)
            EndTextCommandSetBlipName(blip)
            table.insert(vendorBlips, blip)
        end
    end
end

-- =====================================
-- GESTION DU JOB
-- =====================================

RegisterNetEvent('esx:setJob', function(job)
    PlayerData.job = job
    isReporter = job.name == Config.JobName
    UpdateRadialMenu()
    CreateVendorBlips()
end)

RegisterNetEvent('esx:playerLoaded', function(xPlayer)
    PlayerData = xPlayer
    isReporter = PlayerData.job and PlayerData.job.name == Config.JobName
    UpdateRadialMenu()
    CreateVendorBlips()
end)

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    PlayerData = ESX.GetPlayerData()
    if PlayerData.job then
        isReporter = PlayerData.job.name == Config.JobName
    end
    Wait(1000)
    UpdateRadialMenu()
    CreateVendorBlips()
end)

-- =====================================
-- MENU RADIAL OX_LIB
-- =====================================

function UpdateRadialMenu()
    -- Supprimer l'ancien menu s'il existe
    lib.removeRadialItem('weazelnews_menu')

    -- Ajouter le menu seulement si reporter
    if isReporter then
        lib.addRadialItem({
            id = 'weazelnews_menu',
            label = 'Weazel News',
            icon = 'newspaper',
            menu = 'weazelnews_submenu'
        })
    end
end

-- Construire les items du menu radial
local function GetRadialItems()
    local items = {
        {
            label = 'Sortir le Micro',
            icon = 'microphone',
            onSelect = function()
                ToggleMicrophone()
            end
        },
        {
            label = 'Camera Live',
            icon = 'video',
            onSelect = function()
                OpenCameraMenu()
            end
        },
        {
            label = 'Ecrire un Article',
            icon = 'pen-to-square',
            onSelect = function()
                OpenArticleWriter()
            end
        },
        {
            label = 'Consulter les Articles',
            icon = 'book-open',
            onSelect = function()
                OpenArticlesList()
            end
        }
    }

    return items
end

lib.registerRadial({
    id = 'weazelnews_submenu',
    items = GetRadialItems()
})

-- =====================================
-- MENU CAMERA (avec config overlay)
-- =====================================

function OpenCameraMenu()
    if not HasReporterJob() then
        Notify(Config.Messages.noJob, 'error')
        return
    end

    local options = {
        {
            title = isCameraActive and 'Ranger la Camera' or 'Sortir la Camera',
            icon = 'video',
            onSelect = function()
                ToggleCamera()
            end
        }
    }

    -- Ajouter option config si grade suffisant
    if CanConfigureOverlay() then
        table.insert(options, {
            title = 'Configurer l\'Overlay',
            description = 'Personnaliser l\'affichage de la camera',
            icon = 'sliders',
            onSelect = function()
                OpenOverlayConfig()
            end
        })
    end

    lib.registerContext({
        id = 'weazelnews_camera_menu',
        title = 'Camera Weazel News',
        options = options
    })

    lib.showContext('weazelnews_camera_menu')
end

function OpenOverlayConfig()
    local input = lib.inputDialog('Configuration Overlay', {
        {
            type = 'input',
            label = 'Titre principal',
            default = overlayConfig.title,
            required = true
        },
        {
            type = 'input',
            label = 'Sous-titre',
            default = overlayConfig.subtitle,
            required = true
        },
        {
            type = 'input',
            label = 'Texte du ticker (bandeau)',
            default = overlayConfig.ticker,
            required = false
        },
        {
            type = 'checkbox',
            label = 'Afficher la date/heure',
            checked = overlayConfig.showDateTime
        },
        {
            type = 'checkbox',
            label = 'Afficher le badge EN DIRECT',
            checked = overlayConfig.showLiveBadge
        },
        {
            type = 'checkbox',
            label = 'Afficher l\'indicateur REC',
            checked = overlayConfig.showRecIndicator
        },
        {
            type = 'checkbox',
            label = 'Afficher le ticker (bandeau)',
            checked = overlayConfig.showTicker
        },
        {
            type = 'checkbox',
            label = 'Afficher les coins',
            checked = overlayConfig.showCorners
        }
    })

    if input then
        overlayConfig.title = input[1]
        overlayConfig.subtitle = input[2]
        overlayConfig.ticker = input[3] or overlayConfig.ticker
        overlayConfig.showDateTime = input[4]
        overlayConfig.showLiveBadge = input[5]
        overlayConfig.showRecIndicator = input[6]
        overlayConfig.showTicker = input[7]
        overlayConfig.showCorners = input[8]

        Notify('Configuration de l\'overlay mise a jour', 'success')

        -- Si la camera est active, mettre a jour l'overlay
        if isCameraActive then
            EnableCameraOverlay()
        end
    end
end

-- =====================================
-- SYSTEME DE MICROPHONE
-- =====================================

function ToggleMicrophone()
    if not HasReporterJob() then
        Notify(Config.Messages.noJob, 'error')
        return
    end

    if isCameraActive then
        Notify('Rangez d\'abord la camera', 'error')
        return
    end

    local ped = PlayerPedId()
    local prop = Config.Props.microphone

    if isMicOut then
        -- Ranger le micro
        if activeMic then
            DeleteEntity(activeMic)
            activeMic = nil
        end
        ClearPedTasks(ped)
        isMicOut = false
        Notify(Config.Messages.micOff, 'info')
    else
        -- Sortir le micro
        local propHash = LoadModel(prop.model)
        local boneIndex = GetPedBoneIndex(ped, prop.bone)

        activeMic = CreateObject(propHash, 0.0, 0.0, 0.0, true, true, false)
        AttachEntityToEntity(
            activeMic, ped, boneIndex,
            prop.offset.x, prop.offset.y, prop.offset.z,
            prop.rotation.x, prop.rotation.y, prop.rotation.z,
            true, true, false, true, 1, true
        )

        LoadAnimDict(Config.Animations.microphone.dict)
        TaskPlayAnim(ped, Config.Animations.microphone.dict, Config.Animations.microphone.anim, 8.0, -8.0, -1, Config.Animations.microphone.flag, 0, false, false, false)

        isMicOut = true
        Notify(Config.Messages.micOn, 'success')

        -- Thread pour detecter la touche de fermeture
        CreateThread(function()
            while isMicOut do
                Wait(0)
                if IsControlJustPressed(0, 177) then -- BACKSPACE
                    ToggleMicrophone()
                end
            end
        end)
    end
end

-- =====================================
-- SYSTEME DE CAMERA AVEC OVERLAY
-- =====================================

function ToggleCamera()
    if not HasReporterJob() then
        Notify(Config.Messages.noJob, 'error')
        return
    end

    if isMicOut then
        Notify('Rangez d\'abord le micro', 'error')
        return
    end

    local ped = PlayerPedId()
    local prop = Config.Props.camera

    if isCameraActive then
        -- Ranger la camera
        if activeCamera then
            DeleteEntity(activeCamera)
            activeCamera = nil
        end
        ClearPedTasks(ped)
        DisableCameraOverlay()
        isCameraActive = false
        Notify(Config.Messages.cameraOff, 'info')
    else
        -- Sortir la camera
        local propHash = LoadModel(prop.model)
        local boneIndex = GetPedBoneIndex(ped, prop.bone)

        activeCamera = CreateObject(propHash, 0.0, 0.0, 0.0, true, true, false)
        AttachEntityToEntity(
            activeCamera, ped, boneIndex,
            prop.offset.x, prop.offset.y, prop.offset.z,
            prop.rotation.x, prop.rotation.y, prop.rotation.z,
            true, true, false, true, 1, true
        )

        LoadAnimDict(Config.Animations.camera.dict)
        TaskPlayAnim(ped, Config.Animations.camera.dict, Config.Animations.camera.anim, 8.0, -8.0, -1, Config.Animations.camera.flag, 0, false, false, false)

        EnableCameraOverlay()
        isCameraActive = true
        Notify(Config.Messages.cameraOn, 'success')

        -- Thread pour detecter la touche de fermeture
        CreateThread(function()
            while isCameraActive do
                Wait(0)
                if IsControlJustPressed(0, 177) then -- BACKSPACE
                    ToggleCamera()
                end
            end
        end)
    end
end

function EnableCameraOverlay()
    cameraOverlayActive = true
    SendNUIMessage({
        action = 'showOverlay',
        data = {
            title = overlayConfig.title,
            subtitle = overlayConfig.subtitle,
            ticker = overlayConfig.ticker,
            showDateTime = overlayConfig.showDateTime,
            showLiveBadge = overlayConfig.showLiveBadge,
            showRecIndicator = overlayConfig.showRecIndicator,
            showTicker = overlayConfig.showTicker,
            showCorners = overlayConfig.showCorners,
            reporterName = PlayerData.firstName and (PlayerData.firstName .. ' ' .. PlayerData.lastName) or 'Reporter'
        }
    })
end

function DisableCameraOverlay()
    cameraOverlayActive = false
    SendNUIMessage({
        action = 'hideOverlay'
    })
end

-- =====================================
-- SYSTEME D'ECRITURE D'ARTICLES
-- =====================================

function OpenArticleWriter()
    if not HasReporterJob() then
        Notify(Config.Messages.noJob, 'error')
        return
    end

    if isWritingArticle then return end

    isWritingArticle = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openWriter',
        data = {
            reporterName = PlayerData.firstName and (PlayerData.firstName .. ' ' .. PlayerData.lastName) or 'Reporter Anonyme'
        }
    })

    -- Animation d'ecriture
    local ped = PlayerPedId()
    LoadAnimDict(Config.Animations.writing.dict)
    TaskPlayAnim(ped, Config.Animations.writing.dict, Config.Animations.writing.anim, 8.0, -8.0, -1, Config.Animations.writing.flag, 0, false, false, false)
end

RegisterNUICallback('publishArticle', function(data, cb)
    local articleData = {
        title = data.title,
        content = data.content,
        category = data.category,
        author = PlayerData.firstName and (PlayerData.firstName .. ' ' .. PlayerData.lastName) or 'Reporter Anonyme'
    }

    TriggerServerEvent('weazelnews:publishArticle', articleData)
    cb('ok')
end)

RegisterNUICallback('closeWriter', function(data, cb)
    isWritingArticle = false
    SetNuiFocus(false, false)
    ClearPedTasks(PlayerPedId())
    cb('ok')
end)

RegisterNetEvent('weazelnews:articlePublished', function(success, articleId)
    if success then
        Notify(Config.Messages.articlePublished, 'success')
        isWritingArticle = false
        SetNuiFocus(false, false)
        ClearPedTasks(PlayerPedId())
        SendNUIMessage({
            action = 'closeWriter'
        })
    else
        Notify(Config.Messages.articleError, 'error')
    end
end)

-- =====================================
-- CONSULTATION DES ARTICLES
-- =====================================

function OpenArticlesList()
    TriggerServerEvent('weazelnews:getArticles')
end

RegisterNetEvent('weazelnews:receiveArticles', function(articles)
    if not articles or #articles == 0 then
        Notify(Config.Messages.noArticles, 'info')
        return
    end

    cachedArticles = articles

    local options = {}
    for i, article in ipairs(articles) do
        table.insert(options, {
            title = article.title,
            description = 'Par ' .. article.author .. ' - ' .. article.category,
            icon = 'newspaper',
            onSelect = function()
                ViewArticle(article)
            end
        })
    end

    lib.registerContext({
        id = 'weazelnews_articles',
        title = 'Articles Weazel News',
        options = options
    })

    lib.showContext('weazelnews_articles')
end)

function ViewArticle(article)
    lib.alertDialog({
        header = article.title,
        content = '**Auteur:** ' .. article.author .. '\n**Categorie:** ' .. article.category .. '\n**Date:** ' .. article.date .. '\n\n---\n\n' .. article.content,
        centered = true,
        cancel = false,
        labels = {
            confirm = 'Fermer'
        }
    })
end

-- =====================================
-- SYSTEME DE LECTURE DE JOURNAL (ITEM)
-- =====================================

function OpenNewspaper(articles)
    if isReadingNewspaper then return end
    if not articles or #articles == 0 then
        Notify(Config.Messages.noArticles, 'info')
        return
    end

    isReadingNewspaper = true
    cachedArticles = articles
    currentArticleIndex = 1

    local ped = PlayerPedId()
    local prop = Config.Props.newspaper

    -- Creer le prop journal
    local propHash = LoadModel(prop.model)
    local boneIndex = GetPedBoneIndex(ped, prop.bone)

    activeNewspaper = CreateObject(propHash, 0.0, 0.0, 0.0, true, true, false)
    AttachEntityToEntity(
        activeNewspaper, ped, boneIndex,
        prop.offset.x, prop.offset.y, prop.offset.z,
        prop.rotation.x, prop.rotation.y, prop.rotation.z,
        true, true, false, true, 1, true
    )

    -- Animation de lecture
    LoadAnimDict(Config.Animations.reading.dict)
    TaskPlayAnim(ped, Config.Animations.reading.dict, Config.Animations.reading.anim, 8.0, -8.0, -1, Config.Animations.reading.flag, 0, false, false, false)

    -- Afficher le NUI
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openNewspaper',
        data = {
            articles = articles,
            currentIndex = currentArticleIndex,
            totalArticles = #articles
        }
    })

    -- Thread pour les controles
    CreateThread(function()
        while isReadingNewspaper do
            Wait(0)

            -- Fleche droite - Page suivante
            if IsControlJustPressed(0, 175) then
                NextPage()
            end

            -- Fleche gauche - Page precedente
            if IsControlJustPressed(0, 174) then
                PreviousPage()
            end

            -- BACKSPACE - Fermer
            if IsControlJustPressed(0, 177) then
                CloseNewspaper()
            end
        end
    end)
end

function NextPage()
    if currentArticleIndex < #cachedArticles then
        currentArticleIndex = currentArticleIndex + 1
        PlayPageTurnAnimation()
        SendNUIMessage({
            action = 'changePage',
            data = {
                currentIndex = currentArticleIndex,
                direction = 'next'
            }
        })
    end
end

function PreviousPage()
    if currentArticleIndex > 1 then
        currentArticleIndex = currentArticleIndex - 1
        PlayPageTurnAnimation()
        SendNUIMessage({
            action = 'changePage',
            data = {
                currentIndex = currentArticleIndex,
                direction = 'prev'
            }
        })
    end
end

function PlayPageTurnAnimation()
    local ped = PlayerPedId()
    LoadAnimDict(Config.Animations.turnPage.dict)
    TaskPlayAnim(ped, Config.Animations.turnPage.dict, Config.Animations.turnPage.anim, 8.0, -8.0, 1000, Config.Animations.turnPage.flag, 0, false, false, false)

    -- Retourner a l'animation de lecture
    Wait(1000)
    if isReadingNewspaper then
        LoadAnimDict(Config.Animations.reading.dict)
        TaskPlayAnim(ped, Config.Animations.reading.dict, Config.Animations.reading.anim, 8.0, -8.0, -1, Config.Animations.reading.flag, 0, false, false, false)
    end
end

function CloseNewspaper()
    isReadingNewspaper = false

    if activeNewspaper then
        DeleteEntity(activeNewspaper)
        activeNewspaper = nil
    end

    ClearPedTasks(PlayerPedId())
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeNewspaper'
    })
end

RegisterNUICallback('closeNewspaper', function(data, cb)
    CloseNewspaper()
    cb('ok')
end)

-- =====================================
-- ITEM JOURNAL OX_INVENTORY
-- =====================================

exports('useNewspaper', function(data, slot)
    TriggerServerEvent('weazelnews:getArticlesForNewspaper')
end)

RegisterNetEvent('weazelnews:openNewspaperWithArticles', function(articles)
    OpenNewspaper(articles)
end)

-- =====================================
-- POINTS DE VENTE DE JOURNAUX (ox_target seulement, pas de blip global)
-- =====================================

CreateThread(function()
    Wait(1000)

    for _, vendor in ipairs(Config.NewspaperVendors) do
        exports.ox_target:addSphereZone({
            coords = vendor.coords,
            radius = 1.5,
            options = {
                {
                    name = 'buy_newspaper',
                    label = 'Acheter un journal ($' .. Config.NewspaperPrice .. ')',
                    icon = 'fa-solid fa-newspaper',
                    onSelect = function()
                        TriggerServerEvent('weazelnews:buyNewspaper')
                    end
                }
            }
        })
    end
end)

-- =====================================
-- BLIP QG WEAZEL NEWS (VISIBLE POUR TOUS)
-- =====================================

CreateThread(function()
    Wait(1000)

    local blip = AddBlipForCoord(Config.WeazelHQ.coords.x, Config.WeazelHQ.coords.y, Config.WeazelHQ.coords.z)
    SetBlipSprite(blip, Config.Blips.hqSprite)
    SetBlipDisplay(blip, 4)
    SetBlipScale(blip, Config.Blips.hqScale)
    SetBlipColour(blip, Config.Blips.hqColor)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextEntry('weazelnews_hq', 'QG Weazel News')
    EndTextCommandSetBlipName(blip)
end)

-- =====================================
-- CLEANUP
-- =====================================

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    -- Nettoyer les props
    if activeMic then DeleteEntity(activeMic) end
    if activeCamera then DeleteEntity(activeCamera) end
    if activeNewspaper then DeleteEntity(activeNewspaper) end

    -- Supprimer les blips vendeurs
    for _, blip in ipairs(vendorBlips) do
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end

    -- Fermer les NUI
    SetNuiFocus(false, false)

    -- Supprimer le menu radial
    lib.removeRadialItem('weazelnews_menu')
end)
