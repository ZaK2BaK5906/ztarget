-- =====================================
-- ITEM A AJOUTER DANS ox_inventory/data/items.lua
-- =====================================

--[[
    IMPORTANT: stack = false pour que chaque journal soit unique !

    Ajoutez cette ligne dans votre fichier ox_inventory/data/items.lua :

    ['newspaper'] = {
        label = 'Journal Weazel News',
        weight = 100,
        stack = false,
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
        "stack": false,
        "close": true,
        "description": "Un journal contenant les dernieres actualites de Los Santos",
        "client": {
            "export": "p_weazelnews.useNewspaper"
        }
    }

    NOTE: Chaque journal a maintenant un numero de serie unique (serial)
    pour s'assurer qu'ils ne se melangent pas dans l'inventaire.
]]
