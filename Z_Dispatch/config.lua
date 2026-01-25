Config = {}

-- Mode debug : true = logs dans F8, false = aucun log
Config.Debug = true

-- Duree d'affichage de l'alerte (en millisecondes)
Config.AlertDuration = 15000

-- Son de l'alerte (true = activer, false = desactiver)
Config.AlertSound = true

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
