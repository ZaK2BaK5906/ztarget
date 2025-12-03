Config = {}

-- Distance maximale pour les interactions
Config.InteractionDistance = 2.5

-- Groupes autorisés pour certaines actions (jobs ESX)
Config.PoliceJobs = {'police', 'sheriff', 'fbi'}
Config.MedicJobs = {'ambulance', 'doctor'}

-- Montant minimum et maximum pour donner de l'argent
Config.MinMoneyAmount = 1
Config.MaxMoneyAmount = 50000

-- Activer/désactiver certaines interactions
Config.EnableCarry = true
Config.EnableHostage = true
Config.EnableCopyAnim = true
Config.EnableGreet = true
Config.EnableGiveMoney = true
Config.EnableGiveItem = true
Config.EnableHandshake = true
Config.EnableSearch = true -- Nécessite un job de police
Config.EnableCheckID = true
Config.EnableHandcuff = true -- Nécessite un job de police
Config.EnableCheckPulse = true -- Nécessite un job de médecin

-- Animations
Config.Animations = {
    carry = {
        dict = 'missfinale_c2mcs_1',
        anim = 'fin_c2_mcs_1_camman',
        flag = 49
    },
    carried = {
        dict = 'nm',
        anim = 'firemans_carry',
        flag = 33
    },
    hostage = {
        dict = 'anim@gangops@hostage@',
        anim = 'perp_idle',
        flag = 49
    },
    hostage_taker = {
        dict = 'anim@gangops@hostage@',
        anim = 'hitman_idle',
        flag = 49
    },
    greet = {
        dict = 'gestures@m@standing@casual',
        anim = 'gesture_hello',
        flag = 48
    },
    handshake = {
        dict = 'mp_ped_interaction',
        anim = 'handshake_guy_a',
        flag = 48
    },
    handcuff = {
        dict = 'mp_arresting',
        anim = 'idle',
        flag = 49
    },
    checkpulse = {
        dict = 'amb@medic@standing@kneel@base',
        anim = 'base',
        flag = 1
    }
}
