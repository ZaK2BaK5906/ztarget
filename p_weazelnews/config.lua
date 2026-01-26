Config = {}

-- Job configuration
Config.JobName = 'reporter'
Config.JobLabel = 'Weazel News'

-- Webhook Discord pour les notifications d'articles
Config.WebhookURL = '' -- Mettre l'URL du webhook Discord ici
Config.WebhookEnabled = true
Config.WebhookTitle = 'WEAZEL NEWS - NOUVEL ARTICLE'
Config.WebhookColor = 16744448 -- Orange (couleur Weazel News)
Config.WebhookFooter = 'Weazel News - La verite, rien que la verite'
Config.WebhookThumbnail = 'https://i.imgur.com/YOUR_LOGO.png' -- Logo Weazel News

-- Prix du journal dans les boites aux lettres
Config.NewspaperPrice = 50

-- Duree de vie d'un article (en jours, 0 = permanent)
Config.ArticleLifetime = 7

-- Nombre max d'articles par journal
Config.MaxArticlesPerNewspaper = 5

-- Props
Config.Props = {
    microphone = 'p_ing_microphonel_01',
    camera = 'prop_v_cam_01',
    newspaper = 'prop_cliff_paper'
}

-- Animations
Config.Animations = {
    microphone = {
        dict = 'missheistdockssetup1hardhat@',
        anim = 'idle',
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
    }
}

-- Overlay camera
Config.CameraOverlay = {
    enabled = true,
    text = 'WEAZEL NEWS',
    subtext = 'EN DIRECT',
    showDateTime = true
}

-- Keybinds
Config.Keys = {
    openRadial = 'F6', -- Touche pour ouvrir le menu radial
    closeCamera = 'BACKSPACE', -- Fermer la camera
    turnPageLeft = 'LEFT', -- Tourner page gauche
    turnPageRight = 'RIGHT', -- Tourner page droite
    closeNewspaper = 'BACKSPACE' -- Fermer le journal
}

-- Points de vente de journaux (boites aux lettres)
Config.NewspaperVendors = {
    {coords = vector3(-1037.0, -2733.0, 20.0), label = 'Boite aux lettres'},
    {coords = vector3(428.0, -806.0, 29.0), label = 'Boite aux lettres - Legion Square'},
    {coords = vector3(-538.0, -188.0, 38.0), label = 'Boite aux lettres - Vinewood'},
}

-- QG Weazel News
Config.WeazelHQ = {
    coords = vector3(-598.0, -930.0, 23.0),
    radius = 50.0
}

-- Messages
Config.Messages = {
    noJob = 'Vous devez etre reporter pour Weazel News',
    cameraOn = 'Camera activee - Appuyez sur BACKSPACE pour ranger',
    cameraOff = 'Camera rangee',
    micOn = 'Micro sorti - Appuyez sur BACKSPACE pour ranger',
    micOff = 'Micro range',
    articlePublished = 'Article publie avec succes !',
    articleError = 'Erreur lors de la publication',
    noArticles = 'Aucun article disponible',
    newspaperReceived = 'Vous avez recu un journal',
    notEnoughMoney = 'Vous n\'avez pas assez d\'argent'
}
