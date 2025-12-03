# OX Target - Interactions Entre Joueurs

Script d'interactions entre joueurs pour FiveM utilisant ox_target, ox_lib, ox_inventory et ESX.

## Fonctionnalités

### Interactions principales

1. **🚶 Porter le joueur**
   - Permet de porter un autre joueur sur votre épaule
   - Le joueur cible doit accepter la demande
   - Appuyez sur `X` pour arrêter de porter

2. **🔫 Prendre en otage**
   - Permet de prendre un joueur en otage
   - Le joueur cible doit accepter (pour le RP)
   - Appuyez sur `X` pour relâcher l'otage

3. **🎭 Copier l'animation**
   - Copie l'animation que le joueur ciblé est en train de faire
   - Utile pour synchroniser des animations RP

4. **👋 Dire bonjour**
   - Effectue une animation de salutation
   - Notifie le joueur ciblé

5. **💵 Donner de l'argent**
   - Ouvre un dialogue pour spécifier le montant
   - Transfert d'argent direct entre joueurs
   - Montant configurable (min/max)

6. **🎁 Donner un objet**
   - Ouvre l'inventaire pour transférer des objets
   - Utilise ox_inventory

### Interactions supplémentaires

7. **🤝 Serrer la main**
   - Animation de poignée de main synchronisée
   - Parfait pour les rencontres RP

8. **🔍 Fouiller** (Police uniquement)
   - Permet aux policiers de fouiller un joueur
   - Affiche l'argent, argent sale et objets
   - Jobs configurables dans `config.lua`

9. **📄 Demander les papiers**
   - Affiche la carte d'identité du joueur
   - Nom, prénom, date de naissance, sexe, taille
   - Accessible à tous

## Installation

1. **Télécharger** le script dans votre dossier `resources`

2. **Vérifier les dépendances** :
   - ox_target
   - ox_lib
   - ox_inventory
   - es_extended

3. **Ajouter** dans votre `server.cfg` :
   ```cfg
   ensure ztarget
   ```

4. **Configurer** le fichier `config.lua` selon vos besoins

## Configuration

### config.lua

```lua
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
Config.EnableSearch = true
Config.EnableCheckID = true
```

### Personnalisation des animations

Vous pouvez modifier les animations dans `config.lua` :

```lua
Config.Animations = {
    carry = {
        dict = 'missfinale_c2mcs_1',
        anim = 'fin_c2_mcs_1_camman',
        flag = 49
    },
    -- ... autres animations
}
```

## Utilisation

1. **Viser un joueur** avec l'œil ox_target (clic molette par défaut)
2. **Sélectionner** l'interaction souhaitée dans le menu
3. **Suivre** les instructions à l'écran

### Touches importantes

- **X** : Arrêter de porter ou relâcher un otage

## Structure des fichiers

```
ztarget/
├── fxmanifest.lua      # Manifest de la ressource
├── config.lua          # Configuration
├── client/
│   └── main.lua        # Script client
├── server/
│   └── main.lua        # Script serveur
└── README.md           # Documentation
```

## Base de données

Le script utilise la table `users` d'ESX pour récupérer les informations des joueurs.

Colonnes requises pour la fonction "Demander les papiers" :
- `firstname`
- `lastname`
- `dateofbirth`
- `sex`
- `height`

## Support

Pour tout problème ou suggestion, ouvrez une issue sur le repository GitHub.

## Crédits

- **Auteur** : ZaK2BaK5906
- **Framework** : ESX
- **Dépendances** : ox_target, ox_lib, ox_inventory

## Licence

MIT License - Libre d'utilisation et de modification
