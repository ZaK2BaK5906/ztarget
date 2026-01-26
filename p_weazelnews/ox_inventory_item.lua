-- =====================================
-- ITEM A AJOUTER DANS ox_inventory/data/items.lua
-- =====================================

--[[
    Ajoutez cette ligne dans votre fichier ox_inventory/data/items.lua :

    ['newspaper'] = {
        label = 'Journal Weazel News',
        weight = 100,
        stack = true,
        close = true,
        description = 'Un journal contenant les dernieres actualites de Los Santos',
        client = {
            export = 'p_weazelnews.useNewspaper'
        }
    },

    -- OU si vous utilisez un fichier items.json :

    "newspaper": {
        "label": "Journal Weazel News",
        "weight": 100,
        "stack": true,
        "close": true,
        "description": "Un journal contenant les dernieres actualites de Los Santos",
        "client": {
            "export": "p_weazelnews.useNewspaper"
        }
    }

]]
