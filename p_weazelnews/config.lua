Config = {}

-- Job configuration
Config.JobName = 'reporter'
Config.JobLabel = 'Weazel News'

-- Webhook Discord pour les notifications d'articles
Config.WebhookURL = '' -- Mettre l'URL du webhook Discord ici
Config.WebhookEnabled = true
Config.WebhookTitle = 'WEAZEL NEWS - NOUVELLE EDITION'
Config.WebhookColor = 16744448 -- Orange (couleur Weazel News)
Config.WebhookFooter = 'Weazel News - La verite, rien que la verite'
Config.WebhookThumbnail = 'https://i.imgur.com/YOUR_LOGO.png' -- Logo Weazel News

-- Prix par defaut du journal
Config.DefaultNewspaperPrice = 50

-- Duree de vie d'un article (en jours, 0 = permanent)
Config.ArticleLifetime = 7

-- Nombre max d'articles par edition
Config.MaxArticlesPerEdition = 5

-- Cout d'impression d'un journal (pour le reporter)
Config.PrintCost = 10

-- Props avec position et rotation configurables
Config.Props = {
    microphone = {
        model = 'p_ing_microphonel_01',
        bone = 28422, -- Main droite
        offset = {
            x = 0.0,
            y = 0.0,
            z = 0.0
        },
        rotation = {
            x = 0.0,
            y = 0.0,
            z = 0.0
        }
    },
    camera = {
        model = 'prop_v_cam_01',
        bone = 28422, -- Main droite
        offset = {
            x = 0.1,
            y = 0.05,
            z = 0.0
        },
        rotation = {
            x = -90.0,
            y = 0.0,
            z = 0.0
        }
    },
    newspaper = {
        model = 'prop_cliff_paper',
        bone = 28422,
        offset = {
            x = 0.0,
            y = 0.0,
            z = 0.0
        },
        rotation = {
            x = 0.0,
            y = 0.0,
            z = 0.0
        }
    },
    notepad = {
        model = 'prop_notepad_01',
        bone = 28422,
        offset = {
            x = 0.1,
            y = 0.02,
            z = 0.05
        },
        rotation = {
            x = 10.0,
            y = 0.0,
            z = 0.0
        }
    }
}

-- Animations
Config.Animations = {
    microphone = {
        dict = 'missfbi3_party_d',
        anim = 'yoursfella_mic_idle',
        flag = 49
    },
    camera = {
        dict = 'missfinale_c2mcs_1',
        anim = 'fin_c2_mcs_1_camman',
        flag = 49
    },
    writing = {
        dict = 'missheistdockssetup1clipboard@idle@a',
        anim = 'idle_a',
        flag = 49
    },
    reading = {
        dict = 'amb@world_human_clipboard@male@idle_a',
        anim = 'idle_c',
        flag = 49
    },
    turnPage = {
        dict = 'anim@amb@office@boardroom@boss@',
        anim = 'look_at_phone_read_msg_a',
        flag = 48
    },
    notesTaking = {
        dict = 'missheistdockssetup1clipboard@base',
        anim = 'base',
        flag = 49
    }
}

-- Overlay camera - Options par defaut (peuvent etre changees en jeu par le patron)
Config.CameraOverlay = {
    enabled = true,
    -- Textes personnalisables
    defaultTitle = 'WEAZEL NEWS',
    defaultSubtitle = 'EN DIRECT',
    defaultTicker = 'Los Santos - Weazel News, votre source d\'information numero 1',
    -- Options d'affichage
    showDateTime = true,
    showLiveBadge = true,
    showRecIndicator = true,
    showTicker = true,
    showCorners = true
}

-- Keybinds
Config.Keys = {
    closeCamera = 'BACKSPACE',
    turnPageLeft = 'LEFT',
    turnPageRight = 'RIGHT',
    closeNewspaper = 'BACKSPACE'
}

-- Configuration des blips
Config.Blips = {
    scale = 0.5,
    vendorSprite = 184,
    vendorColor = 47, -- Orange
    hqSprite = 184,
    hqColor = 47,
    hqScale = 0.7
}

-- Points de vente de journaux (boites aux lettres) - VISIBLE UNIQUEMENT POUR LE JOB
-- Chaque vendor a un ID unique pour gerer son stock
Config.NewspaperVendors = {
    {id = 1, coords = vector3(-1037.0, -2733.0, 20.0), label = 'Boite aux lettres - Aeroport'},
    {id = 2, coords = vector3(428.0, -806.0, 29.0), label = 'Boite aux lettres - Legion Square'},
    {id = 3, coords = vector3(-538.0, -188.0, 38.0), label = 'Boite aux lettres - Vinewood'},
    {id = 4, coords = vector3(145.0, -1035.0, 29.0), label = 'Boite aux lettres - Pillbox'},
    {id = 5, coords = vector3(-1220.0, -330.0, 37.0), label = 'Boite aux lettres - Rockford'},
}

-- QG Weazel News - VISIBLE POUR TOUT LE MONDE
Config.WeazelHQ = {
    coords = vector3(-598.0, -930.0, 23.0),
    radius = 50.0
}

-- Zone d'impression (dans le QG)
Config.PrintZone = {
    coords = vector3(-600.0, -932.0, 23.0),
    radius = 2.0
}

-- Categories d'articles
Config.Categories = {
    'Actualites',
    'Politique',
    'Economie',
    'Sport',
    'Faits Divers',
    'Culture',
    'Meteo',
    'Interview',
    'Enquete',
    'Necrologie'
}

-- Messages
Config.Messages = {
    noJob = 'Vous devez etre reporter pour Weazel News',
    cameraOn = 'Camera activee - Appuyez sur BACKSPACE pour ranger',
    cameraOff = 'Camera rangee',
    micOn = 'Micro sorti - Appuyez sur BACKSPACE pour ranger',
    micOff = 'Micro range',
    articleSaved = 'Article sauvegarde !',
    articleError = 'Erreur lors de la sauvegarde',
    noteSaved = 'Note enregistree !',
    noteError = 'Erreur lors de l\'enregistrement',
    noArticles = 'Aucun article disponible',
    noNotes = 'Aucune note enregistree',
    noEditions = 'Aucune edition disponible',
    editionPrinted = 'Edition imprimee avec succes !',
    printError = 'Erreur lors de l\'impression',
    stockAdded = 'Stock ajoute au point de vente !',
    stockError = 'Erreur lors de l\'ajout du stock',
    notEnoughMoney = 'Vous n\'avez pas assez d\'argent',
    noStock = 'Aucun journal en stock a ce point',
    newspaperBought = 'Journal achete !',
    notInPrintZone = 'Vous devez etre dans la zone d\'impression'
}

-- Grade minimum pour configurer l'overlay (0 = tous, 3 = redacteur en chef, 4 = directeur)
Config.MinGradeForOverlayConfig = 3

-- Grade minimum pour imprimer des editions (0 = tous)
Config.MinGradeForPrint = 1
