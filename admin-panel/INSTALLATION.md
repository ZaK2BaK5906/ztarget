# 🚀 Guide d'Installation Rapide - Panel Admin FiveM

## ⚡ Installation en 5 Minutes

### 1️⃣ Créer la Base de Données

Ouvrez HeidiSQL et créez une nouvelle base de données :

```sql
CREATE DATABASE fivem_admin_panel;
```

### 2️⃣ Installer le Backend

```bash
cd admin-panel/backend

# Installer les dépendances
npm install

# Le fichier .env est déjà configuré avec vos paramètres
# Générer Prisma et créer les tables
npm run prisma:generate
npm run prisma:migrate

# Démarrer le serveur
npm run dev
```

✅ Le backend est lancé sur `http://localhost:3001`

### 3️⃣ Installer le Frontend

Ouvrez un **nouveau terminal** :

```bash
cd admin-panel/frontend

# Installer les dépendances
npm install

# Démarrer le frontend
npm run dev
```

✅ Le frontend est lancé sur `http://localhost:3000`

### 4️⃣ Première Connexion

1. Ouvrez votre navigateur : `http://localhost:3000`
2. Connectez-vous avec :
   - **Email** : `admin@fivem.local`
   - **Mot de passe** : `ChangeMe123!`

3. **⚠️ IMPORTANT** : Allez dans Paramètres et changez le mot de passe immédiatement !

### 5️⃣ Configuration Initiale

1. **Créer des Templates** :
   - Allez dans "Templates"
   - Créez au moins :
     - 3 Questions Obligatoires
     - 6 Scénarios (3 Legal + 3 Illégal)
     - 5 Questions de Règlement
     - 2 Lexiques

2. **Créer des Admins** (optionnel) :
   - Allez dans "Admins"
   - Créez les comptes de vos autres admins
   - Configurez leurs permissions

3. **Configurer Discord Webhooks** (optionnel) :
   - Dans votre serveur Discord, créez des webhooks
   - Ajoutez les URLs dans `backend/.env`
   - Redémarrez le backend

## ✅ C'est Prêt !

Vous pouvez maintenant :
- Créer votre première whitelist : Cliquez sur "Nouvelle WL"
- Consulter le Dashboard pour voir les statistiques
- Gérer vos templates
- Voir l'historique des whitelists

## 🔧 Commandes Utiles

### Backend
```bash
npm run dev          # Développement (avec hot reload)
npm run build        # Build pour production
npm start           # Lancer en production
npm run prisma:studio # Interface graphique de la BDD
```

### Frontend
```bash
npm run dev         # Développement
npm run build       # Build pour production
```

## ❓ Problèmes Courants

### "Port 3001 already in use"
Un autre processus utilise le port. Changez le port dans `backend/.env` :
```
PORT=3002
```

### Erreur de connexion à la base de données
Vérifiez que :
- MariaDB/MySQL est démarré
- Le mot de passe dans `DATABASE_URL` est correct
- La base de données `fivem_admin_panel` existe

### Le frontend ne se connecte pas au backend
Vérifiez que :
- Le backend est bien lancé (`npm run dev` dans le dossier backend)
- L'URL dans `frontend/vite.config.ts` est correcte

## 📚 Plus d'Informations

Consultez le `README.md` principal pour la documentation complète.

---

**Bon courage !** 🎮
