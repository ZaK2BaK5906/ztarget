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
        content = '||@here|| **NOUVELLE EDITION DISPONIBLE !**\nRendez-vous dans les boites aux lettres pour recuperer votre journal !',
        embeds = embed
    }), {['Content-Type'] = 'application/json'})
end

-- Webhook pour envoyer une edition complete avec tous ses articles
local function SendEditionWebhook(editionName, articles, printedBy, price)
    if not Config.WebhookEnabled or Config.WebhookURL == '' then return end

    local currentTime = os.date('%d/%m/%Y %H:%M')

    -- Creer les embeds pour chaque article (max 10 embeds par message Discord)
    local embeds = {}

    -- Premier embed: Header de l'edition
    table.insert(embeds, {
        ['title'] = '📰 ' .. editionName,
        ['description'] = '**Nouvelle edition disponible !**\n\nPrix: $' .. price .. '\nImprime par: ' .. printedBy .. '\nDate: ' .. currentTime,
        ['color'] = Config.WebhookColor,
        ['thumbnail'] = {
            ['url'] = Config.WebhookThumbnail
        }
    })

    -- Ajouter chaque article comme embed (max 9 articles pour rester sous la limite de 10)
    for i, article in ipairs(articles) do
        if i > 9 then break end

        local articleContent = article.content or ''
        -- Limiter a 1000 caracteres par article
        if string.len(articleContent) > 1000 then
            articleContent = string.sub(articleContent, 1, 1000) .. '...'
        end

        table.insert(embeds, {
            ['title'] = (article.category and ('**[' .. article.category .. ']** ') or '') .. article.title,
            ['description'] = (article.subtitle and ('*' .. article.subtitle .. '*\n\n') or '') .. articleContent,
            ['color'] = 0xf5f0e1,
            ['footer'] = {
                ['text'] = 'Par ' .. (article.author or 'Anonyme')
            }
        })
    end

    -- Footer final
    table.insert(embeds, {
        ['description'] = '━━━━━━━━━━━━━━━━━━━━━━\n📍 **Disponible dans toutes les boites aux lettres de Los Santos**\n*The Weazel Gazette - La verite, rien que la verite*',
        ['color'] = Config.WebhookColor
    })

    PerformHttpRequest(Config.WebhookURL, function(err, text, headers) end, 'POST', json.encode({
        username = 'The Weazel Gazette',
        avatar_url = Config.WebhookThumbnail,
        content = '||@here|| **📰 NOUVELLE EDITION : ' .. editionName .. ' 📰**',
        embeds = embeds
    }), {['Content-Type'] = 'application/json'})
end

local function FormatDate(timestamp)
    if not timestamp then return os.date('%d/%m/%Y %H:%M') end
    return os.date('%d/%m/%Y %H:%M', timestamp)
end

-- =====================================
-- SYSTEME DE NOTES
-- =====================================

RegisterNetEvent('weazelnews:saveNote', function(noteData)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:noteSaved', source, false)
        return
    end

    -- Validation des donnees
    if not noteData.title or noteData.title == '' then
        TriggerClientEvent('weazelnews:noteSaved', source, false)
        return
    end

    if not noteData.content or noteData.content == '' then
        TriggerClientEvent('weazelnews:noteSaved', source, false)
        return
    end

    -- Inserer la note dans la base de donnees
    MySQL.insert('INSERT INTO weazelnews_notes (identifier, title, content) VALUES (?, ?, ?)', {
        xPlayer.identifier,
        noteData.title,
        noteData.content
    }, function(noteId)
        if noteId then
            TriggerClientEvent('weazelnews:noteSaved', source, true)
            print(('[Weazel News] Note enregistree par %s: %s'):format(xPlayer.getName(), noteData.title))
        else
            TriggerClientEvent('weazelnews:noteSaved', source, false)
        end
    end)
end)

RegisterNetEvent('weazelnews:getNotes', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then return end

    MySQL.query('SELECT * FROM weazelnews_notes WHERE identifier = ? ORDER BY created_at DESC LIMIT 50', {
        xPlayer.identifier
    }, function(results)
        local notes = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(notes, {
                    id = row.id,
                    title = row.title,
                    content = row.content,
                    date = FormatDate(row.created_at)
                })
            end
        end
        TriggerClientEvent('weazelnews:receiveNotes', source, notes)
    end)
end)

RegisterNetEvent('weazelnews:deleteNote', function(noteId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:noteDeleted', source, false)
        return
    end

    -- Supprimer seulement si la note appartient au joueur
    MySQL.update('DELETE FROM weazelnews_notes WHERE id = ? AND identifier = ?', {
        noteId,
        xPlayer.identifier
    }, function(affectedRows)
        TriggerClientEvent('weazelnews:noteDeleted', source, affectedRows > 0)
    end)
end)

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

    -- Encoder les images en JSON
    local imagesJson = articleData.images and json.encode(articleData.images) or nil

    -- Inserer l'article dans la base de donnees
    MySQL.insert('INSERT INTO weazelnews_articles (title, subtitle, content, author, category, identifier, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
        articleData.title,
        articleData.subtitle or '',
        articleData.content,
        articleData.author,
        articleData.category or 'Actualites',
        xPlayer.identifier,
        imagesJson,
        articleData.status or 'published'
    }, function(articleId)
        if articleId then
            TriggerClientEvent('weazelnews:articlePublished', source, true, articleId)

            -- Envoyer le webhook Discord seulement si publie
            if articleData.status ~= 'draft' then
                SendWebhook(articleData.title, articleData.content, articleData.author, articleData.category or 'Actualites')
            end

            -- Log
            print(('[Weazel News] Article publie par %s: %s'):format(articleData.author, articleData.title))
        else
            TriggerClientEvent('weazelnews:articlePublished', source, false)
        end
    end)
end)

-- =====================================
-- SAUVEGARDE DE BROUILLONS
-- =====================================

RegisterNetEvent('weazelnews:saveDraft', function(articleData)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:draftSaved', source, false)
        return
    end

    -- Validation des donnees
    if not articleData.title or articleData.title == '' then
        TriggerClientEvent('weazelnews:draftSaved', source, false)
        return
    end

    -- Encoder les images en JSON
    local imagesJson = articleData.images and json.encode(articleData.images) or nil

    -- Inserer le brouillon dans la base de donnees
    MySQL.insert('INSERT INTO weazelnews_articles (title, subtitle, content, author, category, identifier, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
        articleData.title,
        articleData.subtitle or '',
        articleData.content or '',
        articleData.author,
        articleData.category or 'Actualites',
        xPlayer.identifier,
        imagesJson,
        'draft'
    }, function(articleId)
        if articleId then
            TriggerClientEvent('weazelnews:draftSaved', source, true)
            print(('[Weazel News] Brouillon sauvegarde par %s: %s'):format(articleData.author, articleData.title))
        else
            TriggerClientEvent('weazelnews:draftSaved', source, false)
        end
    end)
end)

-- =====================================
-- PUBLIER UN BROUILLON
-- =====================================

RegisterNetEvent('weazelnews:publishDraft', function(articleId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:draftPublished', source, false)
        return
    end

    -- Mettre a jour le statut
    MySQL.update('UPDATE weazelnews_articles SET status = ? WHERE id = ? AND identifier = ? AND status = ?', {
        'published',
        articleId,
        xPlayer.identifier,
        'draft'
    }, function(affectedRows)
        if affectedRows > 0 then
            TriggerClientEvent('weazelnews:draftPublished', source, true)

            -- Recuperer l'article pour le webhook
            MySQL.single('SELECT * FROM weazelnews_articles WHERE id = ?', {articleId}, function(article)
                if article then
                    SendWebhook(article.title, article.content, article.author, article.category)
                end
            end)
        else
            TriggerClientEvent('weazelnews:draftPublished', source, false)
        end
    end)
end)

-- =====================================
-- RECUPERATION DES MES ARTICLES
-- =====================================

RegisterNetEvent('weazelnews:getMyArticles', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then return end

    MySQL.query('SELECT * FROM weazelnews_articles WHERE identifier = ? ORDER BY created_at DESC LIMIT 50', {
        xPlayer.identifier
    }, function(results)
        local articles = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(articles, {
                    id = row.id,
                    title = row.title,
                    subtitle = row.subtitle,
                    content = row.content,
                    author = row.author,
                    category = row.category,
                    status = row.status,
                    images = row.images and json.decode(row.images) or {},
                    date = FormatDate(row.created_at)
                })
            end
        end
        TriggerClientEvent('weazelnews:receiveMyArticles', source, articles)
    end)
end)

-- =====================================
-- SUPPRESSION D'ARTICLES
-- =====================================

RegisterNetEvent('weazelnews:deleteArticle', function(articleId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier si admin ou proprietaire
    local isAdmin = IsPlayerAceAllowed(source, 'command.weazelnews_admin')

    if isAdmin then
        -- Admin peut supprimer n'importe quel article
        MySQL.update('DELETE FROM weazelnews_articles WHERE id = ?', {articleId}, function(affectedRows)
            TriggerClientEvent('weazelnews:articleDeleted', source, affectedRows > 0)
        end)
    else
        -- Reporter peut supprimer seulement ses propres articles
        if xPlayer.job.name ~= Config.JobName then
            TriggerClientEvent('weazelnews:articleDeleted', source, false)
            return
        end

        MySQL.update('DELETE FROM weazelnews_articles WHERE id = ? AND identifier = ?', {
            articleId,
            xPlayer.identifier
        }, function(affectedRows)
            TriggerClientEvent('weazelnews:articleDeleted', source, affectedRows > 0)
        end)
    end
end)

-- =====================================
-- SYSTEME D'IMPRESSION D'EDITIONS
-- =====================================

RegisterNetEvent('weazelnews:getPrintableArticles', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then return end

    -- Verifier le grade
    if xPlayer.job.grade < Config.MinGradeForPrint then return end

    -- Recuperer les articles publies (non imprimes)
    MySQL.query('SELECT id, title, author, category FROM weazelnews_articles WHERE status = ? ORDER BY created_at DESC LIMIT 20', {
        'published'
    }, function(results)
        local articles = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(articles, {
                    id = row.id,
                    title = row.title,
                    author = row.author,
                    category = row.category
                })
            end
        end
        TriggerClientEvent('weazelnews:openPrintInterface', source, articles)
    end)
end)

RegisterNetEvent('weazelnews:printEdition', function(editionData)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:editionPrinted', source, false)
        return
    end

    -- Verifier le grade
    if xPlayer.job.grade < Config.MinGradeForPrint then
        TriggerClientEvent('weazelnews:editionPrinted', source, false)
        return
    end

    -- Verifier l'argent
    if xPlayer.getMoney() < Config.PrintCost then
        TriggerClientEvent('ox_lib:notify', source, {
            title = Config.JobLabel,
            description = Config.Messages.notEnoughMoney,
            type = 'error'
        })
        TriggerClientEvent('weazelnews:editionPrinted', source, false)
        return
    end

    -- Validation
    if not editionData.name or editionData.name == '' then
        TriggerClientEvent('weazelnews:editionPrinted', source, false)
        return
    end

    if not editionData.articleIds or #editionData.articleIds == 0 then
        TriggerClientEvent('weazelnews:editionPrinted', source, false)
        return
    end

    -- Creer l'edition
    local articleIdsJson = json.encode(editionData.articleIds)
    local printedBy = xPlayer.getName()

    MySQL.insert('INSERT INTO weazelnews_editions (edition_name, article_ids, printed_by, identifier, price) VALUES (?, ?, ?, ?, ?)', {
        editionData.name,
        articleIdsJson,
        printedBy,
        xPlayer.identifier,
        editionData.price or Config.DefaultNewspaperPrice
    }, function(editionId)
        if editionId then
            -- Retirer l'argent
            xPlayer.removeMoney(Config.PrintCost)

            -- Marquer les articles comme imprimes
            for _, articleId in ipairs(editionData.articleIds) do
                MySQL.update('UPDATE weazelnews_articles SET status = ? WHERE id = ?', {'printed', articleId})
            end

            -- Donner l'item journal avec metadata unique
            exports.ox_inventory:AddItem(source, 'newspaper', 1, {
                editionId = editionId,
                editionName = editionData.name,
                serial = editionId .. '-' .. os.time() .. '-1',
                label = 'Journal - ' .. editionData.name
            })

            TriggerClientEvent('weazelnews:editionPrinted', source, true, editionId)
            print(('[Weazel News] Edition imprimee par %s: %s'):format(printedBy, editionData.name))
        else
            TriggerClientEvent('weazelnews:editionPrinted', source, false)
        end
    end)
end)

-- =====================================
-- SAUVEGARDE ARTICLE DEPUIS EDITEUR D'EDITION
-- =====================================

RegisterNetEvent('weazelnews:saveArticleFromEditor', function(articleData)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:articleFromEditorSaved', source, false)
        return
    end

    -- Validation des donnees
    if not articleData.title or articleData.title == '' then
        TriggerClientEvent('weazelnews:articleFromEditorSaved', source, false)
        return
    end

    -- Encoder les images en JSON
    local imagesJson = articleData.images and json.encode(articleData.images) or nil
    local author = xPlayer.getName()

    if articleData.id and articleData.id > 0 then
        -- Mise a jour d'un article existant
        MySQL.update('UPDATE weazelnews_articles SET title = ?, subtitle = ?, content = ?, category = ?, images = ?, status = ? WHERE id = ? AND identifier = ?', {
            articleData.title,
            articleData.subtitle or '',
            articleData.content or '',
            articleData.category or 'Actualites',
            imagesJson,
            articleData.status or 'published',
            articleData.id,
            xPlayer.identifier
        }, function(affectedRows)
            if affectedRows > 0 then
                -- Renvoyer l'article mis a jour
                local updatedArticle = {
                    id = articleData.id,
                    title = articleData.title,
                    subtitle = articleData.subtitle or '',
                    content = articleData.content or '',
                    author = author,
                    category = articleData.category or 'Actualites',
                    images = articleData.images or {}
                }
                TriggerClientEvent('weazelnews:articleFromEditorSaved', source, true, updatedArticle)
                print(('[Weazel News] Article modifie via editeur par %s: %s'):format(author, articleData.title))
            else
                TriggerClientEvent('weazelnews:articleFromEditorSaved', source, false)
            end
        end)
    else
        -- Nouvel article
        MySQL.insert('INSERT INTO weazelnews_articles (title, subtitle, content, author, category, identifier, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
            articleData.title,
            articleData.subtitle or '',
            articleData.content or '',
            author,
            articleData.category or 'Actualites',
            xPlayer.identifier,
            imagesJson,
            articleData.status or 'published'
        }, function(articleId)
            if articleId then
                -- Renvoyer le nouvel article
                local newArticle = {
                    id = articleId,
                    title = articleData.title,
                    subtitle = articleData.subtitle or '',
                    content = articleData.content or '',
                    author = author,
                    category = articleData.category or 'Actualites',
                    images = articleData.images or {}
                }
                TriggerClientEvent('weazelnews:articleFromEditorSaved', source, true, newArticle)

                -- Webhook si publie
                if articleData.status ~= 'draft' then
                    SendWebhook(articleData.title, articleData.content or '', author, articleData.category or 'Actualites')
                end

                print(('[Weazel News] Article cree via editeur par %s: %s'):format(author, articleData.title))
            else
                TriggerClientEvent('weazelnews:articleFromEditorSaved', source, false)
            end
        end)
    end
end)

-- =====================================
-- EDITEUR D'EDITION AVANCE
-- =====================================

RegisterNetEvent('weazelnews:getArticlesForEditor', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then return end

    -- Verifier le grade
    if xPlayer.job.grade < Config.MinGradeForPrint then return end

    -- Recuperer les articles publies avec leur contenu complet
    MySQL.query('SELECT id, title, subtitle, content, author, category FROM weazelnews_articles WHERE status = ? ORDER BY created_at DESC LIMIT 30', {
        'published'
    }, function(results)
        local articles = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(articles, {
                    id = row.id,
                    title = row.title,
                    subtitle = row.subtitle,
                    content = row.content,
                    author = row.author,
                    category = row.category
                })
            end
        end
        TriggerClientEvent('weazelnews:openEditionEditor', source, articles)
    end)
end)

RegisterNetEvent('weazelnews:printAdvancedEdition', function(editionData)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:advancedEditionPrinted', source, false)
        return
    end

    -- Verifier le grade
    if xPlayer.job.grade < Config.MinGradeForPrint then
        TriggerClientEvent('weazelnews:advancedEditionPrinted', source, false)
        return
    end

    -- Quantite a imprimer (defaut: 1, max: 50)
    local quantity = editionData.quantity or 1
    if quantity < 1 then quantity = 1 end
    if quantity > 50 then quantity = 50 end

    -- Calculer le cout total
    local totalCost = Config.PrintCost * quantity

    -- Verifier l'argent
    if xPlayer.getMoney() < totalCost then
        TriggerClientEvent('ox_lib:notify', source, {
            title = Config.JobLabel,
            description = Config.Messages.notEnoughMoney .. ' ($' .. totalCost .. ' requis)',
            type = 'error'
        })
        TriggerClientEvent('weazelnews:advancedEditionPrinted', source, false)
        return
    end

    -- Validation
    if not editionData.name or editionData.name == '' then
        TriggerClientEvent('weazelnews:advancedEditionPrinted', source, false)
        return
    end

    if not editionData.articleIds or #editionData.articleIds == 0 then
        TriggerClientEvent('weazelnews:advancedEditionPrinted', source, false)
        return
    end

    -- Creer l'edition avec layout et pubs
    local articleIdsJson = json.encode(editionData.articleIds)
    local adsJson = editionData.ads and json.encode(editionData.ads) or nil
    local layoutJson = editionData.layout and json.encode(editionData.layout) or nil
    local printedBy = xPlayer.getName()

    MySQL.insert('INSERT INTO weazelnews_editions (edition_name, article_ids, ads_data, layout_data, template, printed_by, identifier, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
        editionData.name,
        articleIdsJson,
        adsJson,
        layoutJson,
        editionData.template or 'classic',
        printedBy,
        xPlayer.identifier,
        editionData.price or Config.DefaultNewspaperPrice
    }, function(editionId)
        if editionId then
            -- Retirer l'argent total
            xPlayer.removeMoney(totalCost)

            -- Marquer les articles comme imprimes
            for _, articleId in ipairs(editionData.articleIds) do
                MySQL.update('UPDATE weazelnews_articles SET status = ? WHERE id = ?', {'printed', articleId})
            end

            -- Donner les journaux avec metadata unique pour chaque exemplaire
            for i = 1, quantity do
                exports.ox_inventory:AddItem(source, 'newspaper', 1, {
                    editionId = editionId,
                    editionName = editionData.name,
                    serial = editionId .. '-' .. os.time() .. '-' .. i,
                    label = 'Journal - ' .. editionData.name
                })
            end

            -- Envoyer le webhook avec tous les articles
            local placeholders = {}
            for i = 1, #editionData.articleIds do
                table.insert(placeholders, '?')
            end
            local query = 'SELECT * FROM weazelnews_articles WHERE id IN (' .. table.concat(placeholders, ',') .. ')'
            MySQL.query(query, editionData.articleIds, function(results)
                if results and #results > 0 then
                    local articles = {}
                    for _, row in ipairs(results) do
                        table.insert(articles, {
                            title = row.title,
                            subtitle = row.subtitle,
                            content = row.content,
                            author = row.author,
                            category = row.category
                        })
                    end
                    SendEditionWebhook(editionData.name, articles, printedBy, editionData.price or Config.DefaultNewspaperPrice)
                end
            end)

            TriggerClientEvent('weazelnews:advancedEditionPrinted', source, true, editionId, quantity)
            print(('[Weazel News] %d exemplaires imprimes par %s: %s'):format(
                quantity, printedBy, editionData.name
            ))
        else
            TriggerClientEvent('weazelnews:advancedEditionPrinted', source, false)
        end
    end)
end)

-- =====================================
-- RECUPERATION DES ARTICLES D'UNE EDITION
-- =====================================

RegisterNetEvent('weazelnews:getEditionArticles', function(editionId)
    local source = source

    MySQL.single('SELECT * FROM weazelnews_editions WHERE id = ?', {editionId}, function(edition)
        if not edition then
            TriggerClientEvent('weazelnews:openNewspaperWithArticles', source, {articles = {}, editionName = 'Edition inconnue'})
            return
        end

        local articleIds = json.decode(edition.article_ids)
        if not articleIds or #articleIds == 0 then
            TriggerClientEvent('weazelnews:openNewspaperWithArticles', source, {articles = {}, editionName = edition.edition_name})
            return
        end

        -- Construire la requete pour recuperer les articles
        local placeholders = {}
        for i = 1, #articleIds do
            table.insert(placeholders, '?')
        end
        local query = 'SELECT * FROM weazelnews_articles WHERE id IN (' .. table.concat(placeholders, ',') .. ')'

        MySQL.query(query, articleIds, function(results)
            local articles = {}
            if results then
                for _, row in ipairs(results) do
                    table.insert(articles, {
                        id = row.id,
                        title = row.title,
                        subtitle = row.subtitle,
                        content = row.content,
                        author = row.author,
                        category = row.category,
                        images = row.images and json.decode(row.images) or {},
                        date = FormatDate(row.created_at)
                    })
                end
            end
            TriggerClientEvent('weazelnews:openNewspaperWithArticles', source, {
                articles = articles,
                editionName = edition.edition_name
            })
        end)
    end)
end)

-- Fallback pour journaux sans edition
RegisterNetEvent('weazelnews:getArticlesForNewspaper', function()
    local source = source

    local query = 'SELECT * FROM weazelnews_articles WHERE status != ? ORDER BY created_at DESC LIMIT ?'
    if Config.ArticleLifetime > 0 then
        query = 'SELECT * FROM weazelnews_articles WHERE status != ? AND created_at >= DATE_SUB(NOW(), INTERVAL ' .. Config.ArticleLifetime .. ' DAY) ORDER BY created_at DESC LIMIT ?'
    end

    MySQL.query(query, {'draft', Config.MaxArticlesPerEdition}, function(results)
        local articles = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(articles, {
                    id = row.id,
                    title = row.title,
                    subtitle = row.subtitle,
                    content = row.content,
                    author = row.author,
                    category = row.category,
                    images = row.images and json.decode(row.images) or {},
                    date = FormatDate(row.created_at)
                })
            end
        end
        TriggerClientEvent('weazelnews:openNewspaperWithArticles', source, {
            articles = articles,
            editionName = 'Edition Standard'
        })
    end)
end)

-- =====================================
-- SHOP - ACHAT AUX BOITES AUX LETTRES
-- =====================================

RegisterNetEvent('weazelnews:getAllEditions', function(vendorId)
    local source = source

    -- Recuperer toutes les editions disponibles (les 10 dernieres)
    MySQL.query([[
        SELECT id, edition_name, price, article_ids, created_at
        FROM weazelnews_editions
        ORDER BY created_at DESC
        LIMIT 10
    ]], {}, function(results)
        if not results or #results == 0 then
            TriggerClientEvent('weazelnews:noStock', source)
            return
        end

        local editions = {}
        for _, row in ipairs(results) do
            local articleIds = json.decode(row.article_ids) or {}
            table.insert(editions, {
                id = row.id,
                name = row.edition_name,
                price = row.price,
                articles = #articleIds
            })
        end

        TriggerClientEvent('weazelnews:openShop', source, {
            vendorId = vendorId,
            vendorLabel = 'Boite aux lettres',
            editions = editions
        })
    end)
end)

RegisterNetEvent('weazelnews:buyEdition', function(editionId, vendorId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Recuperer l'edition
    MySQL.single('SELECT edition_name, price FROM weazelnews_editions WHERE id = ?', {editionId}, function(result)
        if not result then
            TriggerClientEvent('weazelnews:noStock', source)
            return
        end

        -- Verifier l'argent
        if xPlayer.getMoney() < result.price then
            TriggerClientEvent('ox_lib:notify', source, {
                title = Config.JobLabel,
                description = Config.Messages.notEnoughMoney,
                type = 'error'
            })
            TriggerClientEvent('weazelnews:editionBought', source, false)
            return
        end

        -- Retirer l'argent
        xPlayer.removeMoney(result.price)

        -- Donner le journal avec metadata unique
        exports.ox_inventory:AddItem(source, 'newspaper', 1, {
            editionId = editionId,
            editionName = result.edition_name,
            serial = editionId .. '-' .. os.time() .. '-buy',
            label = 'Journal - ' .. result.edition_name
        })

        TriggerClientEvent('weazelnews:editionBought', source, true)
        print(('[Weazel News] Journal achete par %s: %s'):format(xPlayer.getName(), result.edition_name))
    end)
end)

-- =====================================
-- SUPPRESSION D'EDITIONS
-- =====================================

RegisterNetEvent('weazelnews:getMyEditions', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then return end

    MySQL.query('SELECT id, edition_name, price, created_at FROM weazelnews_editions WHERE identifier = ? ORDER BY created_at DESC LIMIT 20', {
        xPlayer.identifier
    }, function(results)
        local editions = {}
        if results then
            for _, row in ipairs(results) do
                table.insert(editions, {
                    id = row.id,
                    name = row.edition_name,
                    price = row.price,
                    date = FormatDate(row.created_at)
                })
            end
        end
        TriggerClientEvent('weazelnews:receiveMyEditions', source, editions)
    end)
end)

RegisterNetEvent('weazelnews:deleteEdition', function(editionId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)

    if not xPlayer then return end

    -- Verifier que le joueur est reporter
    if xPlayer.job.name ~= Config.JobName then
        TriggerClientEvent('weazelnews:editionDeleted', source, false)
        return
    end

    -- Supprimer seulement si l'edition appartient au joueur
    MySQL.update('DELETE FROM weazelnews_editions WHERE id = ? AND identifier = ?', {
        editionId,
        xPlayer.identifier
    }, function(affectedRows)
        TriggerClientEvent('weazelnews:editionDeleted', source, affectedRows > 0)
        if affectedRows > 0 then
            print(('[Weazel News] Edition #%d supprimee par %s'):format(editionId, xPlayer.getName()))
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
-- COMMANDE POUR CREER UNE EDITION (DEBUG)
-- =====================================

lib.addCommand('createedition', {
    help = 'Creer une edition de test',
    params = {
        {
            name = 'name',
            type = 'string',
            help = 'Nom de l\'edition'
        }
    },
    restricted = 'group.admin'
}, function(source, args, raw)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return end

    MySQL.query('SELECT id FROM weazelnews_articles WHERE status = ? ORDER BY created_at DESC LIMIT 3', {'published'}, function(results)
        if not results or #results == 0 then
            TriggerClientEvent('ox_lib:notify', source, {
                title = Config.JobLabel,
                description = 'Aucun article disponible',
                type = 'error'
            })
            return
        end

        local articleIds = {}
        for _, row in ipairs(results) do
            table.insert(articleIds, row.id)
        end

        MySQL.insert('INSERT INTO weazelnews_editions (edition_name, article_ids, printed_by, identifier, price) VALUES (?, ?, ?, ?, ?)', {
            args.name or 'Edition Test',
            json.encode(articleIds),
            xPlayer.getName(),
            xPlayer.identifier,
            Config.DefaultNewspaperPrice
        }, function(editionId)
            if editionId then
                exports.ox_inventory:AddItem(source, 'newspaper', 1, {
                    editionId = editionId,
                    editionName = args.name or 'Edition Test',
                    serial = editionId .. '-' .. os.time() .. '-admin',
                    label = 'Journal - ' .. (args.name or 'Edition Test')
                })
                TriggerClientEvent('ox_lib:notify', source, {
                    title = Config.JobLabel,
                    description = 'Edition creee avec succes !',
                    type = 'success'
                })
            end
        end)
    end)
end)

-- =====================================
-- LOGS
-- =====================================

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    print('[Weazel News] Resource demarree avec succes!')
end)
