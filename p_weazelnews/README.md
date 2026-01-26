# Weazel News - Job Reporter

Script FiveM complet pour le job de reporter Weazel News avec systeme de journaux, camera live et microphone.

## Fonctionnalites

- **Menu Radial** (ox_lib) accessible uniquement pour les reporters
- **Microphone** avec prop et animation
- **Camera Live** avec overlay professionnel Weazel News (EN DIRECT, REC, etc.)
- **Redaction d'articles** via interface NUI complete
- **Journal lisible** avec animations de changement de page
- **Item journal** pour ox_inventory
- **Webhook Discord** pour les nouveaux articles
- **Points de vente** de journaux (boites aux lettres)

## Dependances

- [ox_lib](https://github.com/overextended/ox_lib)
- [ox_inventory](https://github.com/overextended/ox_inventory)
- [ox_target](https://github.com/overextended/ox_target)
- [oxmysql](https://github.com/overextended/oxmysql)
- [es_extended](https://github.com/esx-framework/esx-legacy) (ESX)

## Installation

### 1. Base de donnees

Executez le fichier `sql/weazelnews.sql` dans votre base de donnees pour creer:
- La table `weazelnews_articles`
- Le job `reporter` avec ses grades

### 2. Configuration ox_inventory

Ajoutez l'item journal dans `ox_inventory/data/items.lua`:

```lua
['newspaper'] = {
    label = 'Journal Weazel News',
    weight = 100,
    stack = true,
    close = true,
    description = 'Un journal contenant les dernieres actualites de Los Santos',
    client = {
        export = 'p_weazelnews.useNewspaper'
    }
},
```

### 3. Webhook Discord

Dans `config.lua`, configurez votre webhook Discord:

```lua
Config.WebhookURL = 'https://discord.com/api/webhooks/VOTRE_WEBHOOK'
Config.WebhookEnabled = true
```

### 4. Demarrer la ressource

Ajoutez dans votre `server.cfg`:
```
ensure p_weazelnews
```

## Configuration

Toutes les options sont dans `config.lua`:

| Option | Description | Defaut |
|--------|-------------|--------|
| `JobName` | Nom du job | `reporter` |
| `NewspaperPrice` | Prix du journal | `50` |
| `ArticleLifetime` | Duree de vie des articles (jours) | `7` |
| `MaxArticlesPerNewspaper` | Articles par journal | `5` |

## Utilisation

### Pour les reporters

1. Ouvrez le menu radial (defaut: F6)
2. Selectionnez "Weazel News"
3. Choisissez une action:
   - **Sortir le Micro**: Tient un microphone avec animation
   - **Camera Live**: Active la camera avec overlay professionnel
   - **Ecrire un Article**: Ouvre l'editeur d'articles
   - **Consulter les Articles**: Voir tous les articles publies

### Pour les citoyens

1. Achetez un journal aux boites aux lettres ($50)
2. Utilisez l'item "Journal Weazel News" dans votre inventaire
3. Lisez les articles avec les fleches gauche/droite
4. Fermez avec BACKSPACE

## Grades du job

| Grade | Nom | Salaire |
|-------|-----|---------|
| 0 | Stagiaire | $500 |
| 1 | Journaliste | $750 |
| 2 | Cameraman | $800 |
| 3 | Redacteur en Chef | $1000 |
| 4 | Directeur | $1500 |

## Commandes Admin

- `/setreporter [id] [grade]` - Definir un joueur comme reporter (necessite group.admin)

## Structure des fichiers

```
p_weazelnews/
├── fxmanifest.lua
├── config.lua
├── README.md
├── ox_inventory_item.lua
├── client/
│   └── main.lua
├── server/
│   └── main.lua
├── html/
│   ├── ui.html
│   ├── style.css
│   ├── script.js
│   └── assets/
└── sql/
    └── weazelnews.sql
```

## Apercu

### Overlay Camera
- Badge "EN DIRECT" anime
- Logo Weazel News
- Indicateur REC
- Barre d'information avec nom du reporter
- Ticker "Breaking News"

### Interface Journal
- Design style journal papier
- Animation de changement de page
- Affichage en colonnes
- Categories d'articles

## Credits

Cree par ZaK2BaK5906
