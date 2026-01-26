Config = {}

-- Mode debug : true = logs dans F8, false = aucun log
Config.Debug = true

-- Duree d'affichage de l'alerte (en millisecondes)
Config.AlertDuration = 15000

-- Duree du blip GPS apres avoir accepte (en secondes) - 0 = infini jusqu'a commande
Config.BlipDuration = 300 -- 5 minutes par defaut

-- Son de l'alerte (true = activer, false = desactiver)
Config.AlertSound = true

-- Touches pour accepter/refuser les alertes
Config.Keys = {
    accept = 246,   -- Y par defaut
    refuse = 73     -- X par defaut
}

-- Couleurs des blips par service
Config.BlipColors = {
    police = 3,     -- Bleu
    sheriff = 24,   -- Jaune/Orange
    ems = 1,        -- Rouge
    custom = 5      -- Jaune
}

-- Sprites des blips par service
Config.BlipSprites = {
    police = 161,   -- Badge police
    sheriff = 477,  -- Badge sheriff
    ems = 61,       -- Ambulance
    custom = 1      -- Cercle standard
}

-- Couleurs RGB des alertes par service (pour l'affichage)
Config.AlertColors = {
    police = {r = 52, g = 152, b = 219},    -- Bleu
    sheriff = {r = 243, g = 156, b = 18},   -- Orange
    ems = {r = 231, g = 76, b = 60},        -- Rouge
    custom = {r = 155, g = 89, b = 182}     -- Violet
}

-- Configuration des alertes par defaut
Config.DefaultAlerts = {
    police = {
        title = 'ALERTE POLICE',
        icon = 'fa-solid fa-shield-halved',
        color = '#3498db'
    },
    sheriff = {
        title = 'ALERTE SHERIFF',
        icon = 'fa-solid fa-hat-cowboy',
        color = '#f39c12'
    },
    ems = {
        title = 'ALERTE EMS',
        icon = 'fa-solid fa-truck-medical',
        color = '#e74c3c'
    },
    custom = {
        title = 'ALERTE',
        icon = 'fa-solid fa-bell',
        color = '#9b59b6'
    }
}

-- Jobs autorises a recevoir les alertes
Config.AuthorizedJobs = {
    police = {'police', 'fbi', 'bcso'},
    sheriff = {'sheriff', 'bcso'},
    ems = {'ambulance', 'ems', 'doctor'},
    all = {'police', 'sheriff', 'ambulance', 'ems', 'fbi', 'bcso', 'doctor'}
}

-- Commandes de test (uniquement si Debug = true)
Config.TestCommands = {
    police = 'testalertpolice',
    sheriff = 'testalertsheriff',
    ems = 'testalertems',
    custom = 'testalertcustom'
}
