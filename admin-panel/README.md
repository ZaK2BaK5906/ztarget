# 🎮 Panel d'Administration FiveM RP - Gestion des Whitelists

Panel d'administration ultra-complet et moderne pour gérer les whitelists d'un serveur FiveM RP avec des fonctionnalités avancées.

## 🌟 Fonctionnalités

### 🔐 Système de Gestion des Utilisateurs
- **Master Admin** : Contrôle total du système
  - Création et gestion des comptes administrateurs
  - Attribution des permissions granulaires
  - Accès aux statistiques avancées
  - Modification/suppression des admins

- **Administrateurs** : Accès personnalisé selon les permissions
  - Gestion des whitelists
  - Accès aux templates
  - Consultation des analytics

### 📊 Dashboard Principal
- Statistiques en temps réel (aujourd'hui/semaine/mois)
- Taux de réussite des whitelists
- Top 5 des admins les plus actifs
- Répartition par catégorie (Legal/Illégal)
- Graphique d'évolution sur 30 jours

### ✅ Processus de Whitelist Complet
**Étape 1 - Informations du candidat :**
- Nom et prénom RP
- Pseudo Discord avec vérification du format
- Âge du joueur (warning si -18)
- Niveau d'expérience RP
- Notes personnelles de l'admin

**Étape 2 - Sélection de la catégorie :**
- Legal / Illégal

**Étape 3 - Questions générées automatiquement :**
- 3 questions obligatoires
- 3 scénarios FiveM RP adaptés à la catégorie (avec réponses)
- 5 questions de règlement aléatoires (avec réponses)
- 2 lexiques aléatoires (avec réponses)

**Étape 4 - Remplissage en direct pendant l'entretien :**
- L'admin lit les questions/scénarios au candidat
- Validation ou refus pour chaque réponse
- Attribution de scores

**Étape 5 - Finalisation :**
- Score total calculé automatiquement (/100 points)
- Suggestion automatique : Accepter/Refuser/En attente
- Commentaire de validation/refus
- Message personnalisé pour Discord (copie automatique)

### 🎯 Système de Traçabilité
- Date et heure de début/fin d'entretien
- Durée totale de l'entretien
- Admin responsable
- Toutes les réponses et scores
- Historique des modifications
- Logs d'activité détaillés

### 🔔 Webhooks Discord
- 🎤 Entretien démarré (embed bleu)
- ✅ WL Validée (embed vert)
- ❌ WL Refusée (embed rouge)
- 👤 Nouvel admin créé
- 🔧 Admin modifié/supprimé
- 📊 Rapport quotidien automatique (minuit)

### 📋 Page Historique des WL
- Vue d'ensemble de toutes les whitelists
- Filtres avancés multiples :
  - Par statut (validé/refusé/en attente)
  - Par admin responsable
  - Par catégorie
  - Par période (date range)
  - Recherche par nom, Discord, ID
- Export CSV/Excel

### 📝 Système de Templates
- Gestion des questions obligatoires
- Création de scénarios RP par catégorie
- Questions de règlement
- Lexiques RP
- Duplication et édition facile

### 💬 Système de Commentaires
- Commentaires entre admins sur chaque WL
- Mentions d'autres admins (@pseudo)
- Historique des discussions

### 📈 Analytics Avancés
- Statistiques générales (all time)
- Taux d'acceptation global
- Score moyen validées vs refusées
- Statistiques par admin (classement, performances)
- Statistiques par catégorie
- Export CSV complet

### 🎨 Interface Premium
- Design moderne glassmorphism/neumorphism
- Mode sombre par défaut (mode clair disponible)
- Animations CSS fluides
- 100% Responsive (mobile/tablette/desktop)
- Navigation latérale rétractable
- PWA installable comme application
- Toasts pour confirmations/erreurs

## 🛠️ Stack Technique

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** pour MariaDB
- **JWT** pour l'authentification
- **bcrypt** pour le hashage des mots de passe
- **Discord Webhooks** pour les notifications

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool ultra-rapide)
- **Tailwind CSS** (styling)
- **Zustand** (state management)
- **React Router v6** (routing)
- **Chart.js** (graphiques)
- **Axios** (API calls)
- **React Hot Toast** (notifications)
- **date-fns** (dates)

### Base de Données
- **MariaDB** (MySQL compatible)

## 📦 Installation

### Prérequis
- Node.js 18+ et npm
- MariaDB/MySQL
- Git

### 1. Cloner le repository
```bash
git clone <votre-repo>
cd ztarget/admin-panel
```

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer le fichier .env avec vos informations
nano .env

# Configuration requise dans .env :
# DATABASE_URL="mysql://root:Floflo1101*@localhost:3306/fivem_admin_panel"
# JWT_SECRET="votre_secret_jwt_ultra_securise"
# PORT=3001
# DISCORD_WEBHOOK_ENTRETIEN="https://discord.com/api/webhooks/..."
# DISCORD_WEBHOOK_VALIDATION="https://discord.com/api/webhooks/..."
# DISCORD_WEBHOOK_REFUS="https://discord.com/api/webhooks/..."
# DISCORD_WEBHOOK_ADMIN="https://discord.com/api/webhooks/..."
# DISCORD_WEBHOOK_RAPPORT="https://discord.com/api/webhooks/..."

# Créer la base de données
# Dans MySQL :
# CREATE DATABASE fivem_admin_panel;

# Générer le client Prisma
npm run prisma:generate

# Créer les tables dans la base de données
npm run prisma:migrate

# Démarrer le serveur en dev
npm run dev

# Ou en production :
npm run build
npm start
```

Le serveur backend démarre sur `http://localhost:3001`

### 3. Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Démarrer en dev
npm run dev

# Ou build pour production :
npm run build
npm run preview
```

Le frontend démarre sur `http://localhost:3000`

## 🚀 Premier Démarrage

1. **Connexion Master Admin** :
   - Email : `admin@fivem.local` (ou celui configuré dans .env)
   - Mot de passe : `ChangeMe123!` (ou celui configuré dans .env)
   - **⚠️ IMPORTANT : Changez immédiatement ce mot de passe dans Paramètres !**

2. **Créer des templates** :
   - Allez dans Templates
   - Créez vos questions obligatoires (3 minimum)
   - Créez vos scénarios RP pour Legal et Illégal
   - Créez vos questions de règlement (5 minimum)
   - Créez vos lexiques (2 minimum)

3. **Créer des admins** :
   - Allez dans Admins
   - Créez vos comptes administrateurs
   - Configurez leurs permissions

4. **Configurer les Webhooks Discord** :
   - Créez des webhooks Discord dans votre serveur
   - Ajoutez les URLs dans le fichier `.env` du backend
   - Redémarrez le backend

## 📖 Guide d'Utilisation

### Mener un Entretien de Whitelist

1. Cliquez sur **"Nouvelle WL"**
2. Remplissez les informations du candidat pendant que vous êtes en vocal Discord
3. Sélectionnez la catégorie (Legal/Illégal)
4. Le système génère automatiquement les questions
5. Lisez chaque question/scénario au candidat
6. Notez les réponses et validez/refusez en temps réel
7. À la fin, le système calcule le score total
8. Prenez votre décision (Accepter/Refuser/En attente)
9. Copiez le message personnalisé pour Discord
10. Finalisez l'entretien

### Consulter l'Historique

1. Allez dans **Whitelists**
2. Utilisez les filtres pour rechercher :
   - Par nom, Discord
   - Par statut (validé/refusé)
   - Par catégorie
   - Par période
3. Cliquez sur une whitelist pour voir tous les détails
4. Ajoutez des commentaires pour vos collègues admins

### Gérer les Templates

1. Allez dans **Templates**
2. Créez/modifiez/supprimez vos questions
3. Dupliquez facilement des templates existants
4. Organisez-les par catégorie

## 🔒 Permissions

Le système de permissions permet un contrôle granulaire :

- **canViewDashboard** : Voir le dashboard
- **canViewWhitelists** : Voir les whitelists
- **canViewTemplates** : Voir les templates
- **canViewAdmins** : Voir la liste des admins
- **canViewAnalytics** : Voir les analytics
- **canManageWhitelists** : Créer/modifier des whitelists
- **canManageTemplates** : Créer/modifier/supprimer des templates
- **canManageAdmins** : Créer/modifier/supprimer des admins

Le Master Admin a **toutes** les permissions par défaut.

## 🎨 Personnalisation

### Modifier les Couleurs

Éditez `frontend/tailwind.config.js` pour changer les couleurs du thème.

### Ajouter des Champs Personnalisés

1. Modifiez le schéma Prisma : `backend/prisma/schema.prisma`
2. Exécutez `npm run prisma:migrate`
3. Mettez à jour les types TypeScript : `frontend/src/types/index.ts`
4. Ajoutez les champs dans les formulaires

## 📊 Base de Données

### Structure Principale

- **admins** : Utilisateurs du panel
- **whitelists** : Entretiens de whitelist
- **templates** : Questions/scénarios
- **answers** : Réponses aux questions
- **comments** : Commentaires entre admins
- **activity_logs** : Logs d'activité

### Schéma Prisma

Consultez `backend/prisma/schema.prisma` pour le schéma complet.

## 🔧 Scripts Utiles

### Backend
```bash
npm run dev          # Développement
npm run build        # Build production
npm start           # Lancer en production
npm run prisma:studio # Interface de gestion BDD
```

### Frontend
```bash
npm run dev         # Développement
npm run build       # Build production
npm run preview     # Preview du build
```

## 🐛 Dépannage

### Problème de connexion à la base de données
- Vérifiez que MariaDB est démarré
- Vérifiez l'URL de connexion dans `.env`
- Vérifiez que la base de données existe

### Les webhooks Discord ne fonctionnent pas
- Vérifiez que les URLs sont correctes dans `.env`
- Redémarrez le backend après modification
- Vérifiez les logs du serveur

### Erreur "Module not found"
- Supprimez `node_modules` et `package-lock.json`
- Exécutez `npm install` à nouveau

## 🔐 Sécurité

- **IMPORTANT** : Changez le mot de passe du Master Admin immédiatement
- **IMPORTANT** : Changez le JWT_SECRET en production
- Ne commitez **JAMAIS** le fichier `.env`
- Utilisez HTTPS en production
- Mettez à jour régulièrement les dépendances

## 📝 Licence

MIT License - Libre d'utilisation et de modification

## 👨‍💻 Auteur

**ZaK2BaK5906**

## 🆘 Support

Pour tout problème ou suggestion, ouvrez une issue sur le repository GitHub.

---

**Version** : 1.0.0
**Dernière mise à jour** : Décembre 2024
