local ESX = exports['es_extended']:getSharedObject()

-- =====================================
-- FONCTIONS UTILITAIRES
-- =====================================

local function SendWebhook(title, content, author, category)
    if not Config.WebhookEnabled or Config.WebhookURL == '' then return end

    local currentTime = os.date('%d/%m/%Y %H:%M')

    local embed = {
        {
            ['title'] = Config.WebhookTitle,
            ['description'] = '**' .. title .. '**\n\n' .. string.sub(content, 1, 500) .. (string.len(content) > 500 and '...' or ''),
            ['color'] = Config.WebhookColor,
            ['fields'] = {
                {
                    ['name'] = 'Journaliste',
                    ['value'] = author,
                    ['inline'] = true
                },
                {
                    ['name'] = 'Categorie',
                    ['value'] = category,
                    ['inline'] = true
                },
                {
                    ['name'] = 'Date de publication',
                    ['value'] = currentTime,
                    ['inline'] = true
                }
            },
            ['footer'] = {
                ['text'] = Config.WebhookFooter,
                ['icon_url'] = Config.WebhookThumbnail
            },
            ['thumbnail'] = {
                ['url'] = Config.WebhookThumbnail
            }
        }
    }

    PerformHttpRequest(Config.WebhookURL, function(err, text, headers) end, 'POST', json.encode({
        username = 'Weazel News',
        avatar_url = Config.WebhookThumbnail,
        content = '||@here|| **NOUVEL ARTICLE DISPONIBLE !**\nRendez-vous dans les boites aux lettres ou au QG Weazel News pour recuperer votre journal !',
        embeds = embed
    }), {['Content-Type'] = 'application/json'})
end

-- =====================================
-- PUBLICATION D'ARTICLES
-- =====================================

RegisterNetEvent('weazelnews:publishArticle', function(articleData)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:articlePublished', source, false)
        return
    end

    -- Validation des donnees
    if not articleData.title or articleData.title == '' then
        TriggerClientEvent('weazelnews:articlePublished', source, false)
        return
    end

    if not articleData.content or articleData.content == '' then
        TriggerClientEvent('weazelnews:articlePublished', source, false)
        return
    end

    -- Inserer l'article dans la base de donnees
    MySQL.insert('INSERT INTO weazelnews_articles (title, content, author, category, identifier) VALUES (?, ?, ?, ?, ?)', {
        articleData.title,
        articleData.content,
        articleData.author,
        articleData.category or 'Actualites',
        xPlayer.identifier
    }, function(articleId)
        if articleId then
            TriggerClientEvent('weazelnews:articlePublished', source, true, articleId)

            -- Envoyer le webhook Discord
            SendWebhook(articleData.title, articleData.content, articleData.author, articleData.category or 'Actualites')

            -- Log
            print(('[Weazel News] Nouvel article publie par %s: %s'):format(articleData.author, articleData.title))
        else
            TriggerClientEvent('weazelnews:articlePublished', source, false)
        end
    end)
end)

-- =====================================
-- RECUPERATION DES ARTICLES
-- =====================================

RegisterNetEvent('weazelnews:getArticles', function()
    local source = source

    local query = 'SELECT * FROM weazelnews_articles ORDER BY created_at DESC LIMIT ?'
    if Config.ArticleLifetime > 0 then
        query = 'SELECT * FROM weazelnews_articles WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at DESC LIMIT ?'
    end

    local params = Config.ArticleLifetime > 0 and {Config.ArticleLifetime, 50} or {50}

    MySQL.query(query, params, function(results)
        local articles = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(articles, {
                    id = row.id,
                    title = row.title,
                    content = row.content,
                    author = row.author,
                    category = row.category,
                    date = row.created_at and os.date('%d/%m/%Y %H:%M', row.created_at) or 'Date inconnue'
                })
            end
        end
        TriggerClientEvent('weazelnews:receiveArticles', source, articles)
    end)
end)

-- =====================================
-- ARTICLES POUR LE JOURNAL (ITEM)
-- =====================================

RegisterNetEvent('weazelnews:getArticlesForNewspaper', function()
    local source = source

    local query = 'SELECT * FROM weazelnews_articles ORDER BY created_at DESC LIMIT ?'
    if Config.ArticleLifetime > 0 then
        query = 'SELECT * FROM weazelnews_articles WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at DESC LIMIT ?'
    end

    local params = Config.ArticleLifetime > 0 and {Config.ArticleLifetime, Config.MaxArticlesPerNewspaper} or {Config.MaxArticlesPerNewspaper}

    MySQL.query(query, params, function(results)
        local articles = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(articles, {
                    id = row.id,
                    title = row.title,
                    content = row.content,
                    author = row.author,
                    category = row.category,
                    date = row.created_at and os.date('%d/%m/%Y %H:%M', row.created_at) or 'Date inconnue'
                })
            end
        end
        TriggerClientEvent('weazelnews:openNewspaperWithArticles', source, articles)
    end)
end)

-- =====================================
-- ACHAT DE JOURNAL
-- =====================================

RegisterNetEvent('weazelnews:buyNewspaper', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier si le joueur a assez d'argent
    if xPlayer.getMoney() < Config.NewspaperPrice then
        TriggerClientEvent('ox_lib:notify', source, {
            title = Config.JobLabel,
            description = Config.Messages.notEnoughMoney,
            type = 'error'
        })
        return
    end

    -- Retirer l'argent
    xPlayer.removeMoney(Config.NewspaperPrice)

    -- Donner le journal via ox_inventory
    exports.ox_inventory:AddItem(source, 'newspaper', 1)

    TriggerClientEvent('ox_lib:notify', source, {
        title = Config.JobLabel,
        description = Config.Messages.newspaperReceived,
        type = 'success'
    })
end)

-- =====================================
-- SUPPRESSION D'ARTICLES (ADMIN)
-- =====================================

RegisterNetEvent('weazelnews:deleteArticle', function(articleId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier si admin ou boss weazel
    local isAdmin = IsPlayerAceAllowed(source, 'command.weazelnews_admin')
    local isBoss = xPlayer.job.name == Config.JobName and xPlayer.job.grade_name == 'boss'

    if not isAdmin and not isBoss then
        TriggerClientEvent('ox_lib:notify', source, {
            title = Config.JobLabel,
            description = 'Vous n\'avez pas la permission',
            type = 'error'
        })
        return
    end

    MySQL.update('DELETE FROM weazelnews_articles WHERE id = ?', {articleId}, function(affectedRows)
        if affectedRows > 0 then
            TriggerClientEvent('ox_lib:notify', source, {
                title = Config.JobLabel,
                description = 'Article supprime',
                type = 'success'
            })
        else
            TriggerClientEvent('ox_lib:notify', source, {
                title = Config.JobLabel,
                description = 'Article non trouve',
                type = 'error'
            })
        end
    end)
end)

-- =====================================
-- COMMANDE ADMIN POUR DONNER LE JOB
-- =====================================

lib.addCommand('setreporter', {
    help = 'Definir un joueur comme reporter Weazel News',
    params = {
        {
            name = 'id',
            type = 'playerId',
            help = 'ID du joueur'
        },
        {
            name = 'grade',
            type = 'number',
            help = 'Grade (0-4)',
            optional = true
        }
    },
    restricted = 'group.admin'
}, function(source, args, raw)
    local targetId = args.id
    local grade = args.grade or 0

    local xTarget = ESX.GetPlayerFromId(targetId)
    if xTarget then
        xTarget.setJob(Config.JobName, grade)
        TriggerClientEvent('ox_lib:notify', source, {
            title = Config.JobLabel,
            description = 'Joueur defini comme reporter (grade ' .. grade .. ')',
            type = 'success'
        })
    else
        TriggerClientEvent('ox_lib:notify', source, {
            title = Config.JobLabel,
            description = 'Joueur non trouve',
            type = 'error'
        })
    end
end)

-- =====================================
-- LOGS
-- =====================================

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    print('[Weazel News] Resource demarree avec succes!')
end)
