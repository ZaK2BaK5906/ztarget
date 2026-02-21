fx_version 'cerulean'
game 'gta5'

author 'ZaK2BaK5906'
description 'Systeme de dispatch pour alertes EMS, Police et Sheriff'
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
    'ox_lib'
}
