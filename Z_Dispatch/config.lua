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

-- ============================================
-- SYSTEME D'ALERTE DE TIR AUTOMATIQUE
-- ============================================

Config.GunShot = {
    enabled = true,                    -- Activer/desactiver les alertes de tir
    cooldown = 30,                     -- Cooldown entre chaque alerte (secondes)
    checkInterval = 500,               -- Intervalle de verification (ms)
    excludeJobs = {'police', 'sheriff', 'fbi', 'bcso'}, -- Jobs exclus des alertes
    alertTitle = 'Coups de feu signales',
    alertInfo = 'Tirs entendus dans le secteur'
}

-- ============================================
-- CONFIGURATION ALERTES VEHICULES
-- ============================================

Config.VehicleAlert = {
    enabled = true,
    showModel = true,      -- Afficher le modele du vehicule
    showPlate = true,      -- Afficher la plaque
    showColor = true,      -- Afficher la couleur
    alertTitle = 'Vehicule signale'
}

-- Couleurs des vehicules (traduction)
Config.VehicleColors = {
    [0] = 'Noir Metalise',
    [1] = 'Noir Graphite',
    [2] = 'Noir Acier',
    [3] = 'Gris Fonce',
    [4] = 'Argent',
    [5] = 'Bleu Argent',
    [6] = 'Gris Acier',
    [7] = 'Gris Ombre',
    [8] = 'Argent Pierre',
    [9] = 'Argent Minuit',
    [10] = 'Argent Pistolet',
    [11] = 'Gris Clair',
    [12] = 'Blanc',
    [13] = 'Blanc Givre',
    [14] = 'Blanc Glace',
    [27] = 'Rouge',
    [28] = 'Rouge Torino',
    [29] = 'Rouge Formula',
    [30] = 'Rouge Blaze',
    [31] = 'Rouge Gracieux',
    [32] = 'Rouge Grenat',
    [33] = 'Rouge Desert',
    [34] = 'Rouge Cabernet',
    [35] = 'Rouge Bonbon',
    [36] = 'Rouge Lever Soleil',
    [37] = 'Orange Classique',
    [38] = 'Orange Vif',
    [39] = 'Or',
    [40] = 'Orange Lever Soleil',
    [41] = 'Bronze',
    [42] = 'Jaune',
    [43] = 'Jaune Course',
    [44] = 'Jaune Bronze',
    [45] = 'Vert Citron',
    [46] = 'Olive Champagne',
    [47] = 'Mousse',
    [48] = 'Olive Fonce',
    [49] = 'Vert Fonce',
    [50] = 'Vert Course',
    [51] = 'Vert Mer',
    [52] = 'Vert Olive',
    [53] = 'Vert Vif',
    [54] = 'Vert Essence',
    [55] = 'Bleu Fonce',
    [56] = 'Bleu Saxe',
    [57] = 'Bleu',
    [58] = 'Bleu Marin',
    [59] = 'Bleu Port',
    [60] = 'Bleu Diamant',
    [61] = 'Bleu Surf',
    [62] = 'Bleu Nautique',
    [63] = 'Bleu Vif',
    [64] = 'Bleu Violet',
    [65] = 'Bleu Spinnaker',
    [66] = 'Bleu Ultra',
    [67] = 'Bleu Lumineux',
    [68] = 'Bleu Acier Fonce',
    [69] = 'Bleu Ardoise',
    [70] = 'Bleu Corsa',
    [71] = 'Bleu Minuit',
    [72] = 'Violet Fonce',
    [73] = 'Violet',
    [74] = 'Violet Metallise',
    [75] = 'Violet Ketch',
    [76] = 'Violet Vif',
    [77] = 'Rose Vif',
    [88] = 'Noir Mat',
    [111] = 'Blanc Mat',
    [112] = 'Blanc',
    [134] = 'Jaune Taxi'
}
