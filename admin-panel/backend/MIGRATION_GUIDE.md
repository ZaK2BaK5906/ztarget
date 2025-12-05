# 🔧 Guide de Migration - Ajout des Champs RP Hours et Ban

## ⚠️ IMPORTANT - À FAIRE AVANT DE REDÉMARRER LE SERVEUR

Les nouveaux champs `candidateRpHours` et `isBanned` ont été ajoutés au schéma Prisma, mais la base de données et le client Prisma doivent être mis à jour.

## 📋 Étapes de Migration

### Étape 1: Arrêter le serveur backend
```bash
# Arrêtez le serveur avec Ctrl+C
```

### Étape 2: Exécuter la migration SQL

Ouvrez **HeidiSQL** et connectez-vous à votre base de données `fivem_admin_panel`.

Exécutez les commandes SQL suivantes :

```sql
-- Ajouter la colonne candidateRpHours (nombre d'heures RP, nullable)
ALTER TABLE `whitelists` ADD COLUMN `candidateRpHours` INT NULL;

-- Ajouter la colonne isBanned (joueur banni, par défaut false)
ALTER TABLE `whitelists` ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false;
```

**OU** utilisez le script Node.js fourni :
```bash
node migrate-manual.js
```

### Étape 3: Supprimer et réinstaller le client Prisma

```bash
# Dans le dossier backend
rm -rf node_modules/@prisma
rm -rf node_modules/.prisma

# Réinstaller les dépendances
npm install
```

### Étape 4: Ajouter le nouveau webhook Discord (optionnel)

Ajoutez cette ligne dans votre fichier `.env` :
```env
DISCORD_WEBHOOK_ATTENTE="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
```

Ce webhook sera utilisé pour notifier quand une whitelist est mise en attente (décision: WAITING).

### Étape 5: Redémarrer le serveur

```bash
npm run dev
```

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Créez une nouvelle whitelist
2. Remplissez le champ "Heures RP"
3. La whitelist devrait se créer sans erreur

## 🐛 En cas d'erreur

Si vous voyez encore l'erreur `Unknown argument 'candidateRpHours'` :

1. Vérifiez que les colonnes existent dans la base de données :
   ```sql
   DESCRIBE whitelists;
   ```

2. Supprimez complètement le dossier `node_modules` et réinstallez :
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Redémarrez le serveur

## 📝 Nouvelles Fonctionnalités Disponibles

Après cette migration, vous pourrez :
- ✅ Ajouter le nombre d'heures RP lors de la création d'une whitelist
- ✅ Marquer un joueur comme banni
- ✅ Modifier ces informations sur les whitelists existantes
- ✅ Recevoir des notifications Discord pour les whitelists en attente
- ✅ Modifier les réponses des whitelists (scores, validation, notes)

## 🆘 Support

Si vous rencontrez des problèmes, vérifiez :
- La base de données est bien démarrée
- Les credentials dans `.env` sont corrects
- Les colonnes ont bien été ajoutées à la table `whitelists`
