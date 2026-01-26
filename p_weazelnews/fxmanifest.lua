fx_version 'cerulean'
game 'gta5'

author 'ZaK2BaK5906'
description 'Weazel News - Job Reporter avec journal, camera et micro'
version '1.0.0'

lua54 'yes'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua'
}

client_scripts {
    'client/*.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/*.lua'
}

ui_page 'html/ui.html'

files {
    'html/ui.html',
    'html/style.css',
    'html/script.js',
    'html/assets/*.png'
}

dependencies {
    'ox_lib',
    'ox_inventory',
    'oxmysql',
    'es_extended'
}
