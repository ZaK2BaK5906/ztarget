fx_version 'cerulean'
game 'gta5'

author 'ZaK2BaK5906'
description 'Interactions entre joueurs avec ox_target'
version '1.0.0'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua'
}

client_scripts {
    'client/*.lua'
}

server_scripts {
    'server/*.lua'
}

dependencies {
    'ox_target',
    'ox_lib',
    'ox_inventory',
    'es_extended',
    'p_policejob'
}
