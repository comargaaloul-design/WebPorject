# Application de Monitoring et Redémarrage de Serveurs

Une application web moderne pour le monitoring en temps réel et la gestion des redémarrages de serveurs, remplaçant votre script bash existant par une interface utilisateur intuitive.

## 🚀 Fonctionnalités Principales

### Monitoring en Temps Réel
- Vérification automatique des serveurs (ping + telnet) toutes les minutes
- Dashboard temps réel avec WebSocket
- Alertes automatiques par email en cas de problème
- Indicateurs visuels de statut pour chaque serveur

### Gestion des Serveurs
- Interface CRUD complète pour les serveurs
- Configuration IP, ports, groupes
- Serveurs pré-configurés de votre infrastructure existante
- Activation/désactivation de serveurs

### Système de Redémarrage
- Redémarrage immédiat ou planifié
- Sélection flexible : serveur unique, groupes, ou stack complet
- Logique de redémarrage basée sur votre script bash existant
- Notifications email optionnelles

### Authentification et Permissions
- Système de rôles : Admin, Opérateur, Visualiseur
- Permissions granulaires par fonctionnalité
- Gestion complète des utilisateurs
- Sessions sécurisées avec JWT

### Audit et Logs
- Traçabilité complète de toutes les actions
- Logs détaillés des redémarrages
- Export des données d'audit
- Recherche et filtrage avancés

## 🛠 Technologies Utilisées

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **WebSocket**: Socket.io pour le temps réel
- **Containerisation**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Icons**: Lucide React

## 📋 Prérequis

- Docker 26.1.3+ et Docker Compose
- Oracle Linux 8.10 (comme votre serveur actuel)
- Accès SSH aux serveurs à gérer
- Compte Microsoft 365 pour les notifications email

## 🚀 Installation et Déploiement

### 1. Cloner et Préparer l'Environnement

```bash
# Sur votre serveur Oracle Linux 8.10
git clone <repository-url>
cd server-monitoring-app

# Copier et configurer les variables d'environnement
cp .env.example .env
```

### 2. Configurer les Variables d'Environnement

Éditez le fichier `.env` :

```bash
# API Backend
VITE_API_URL=http://your-server-ip:5000

# Base de données
MONGODB_URI=mongodb://mongodb:27017/server-monitoring

# Email Microsoft 365
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourcompany.com
EMAIL_PASSWORD=your-app-password
```

### 3. Configurer les Adresses IP des Serveurs

Les serveurs de votre script sont pré-configurés mais avec des IPs temporaires. Mettez à jour les vraies adresses IP :

1. Démarrez l'application (voir étape 4)
2. Connectez-vous avec admin/admin123
3. Allez dans "Gestion des Serveurs"
4. Modifiez chaque serveur pour saisir les vraies IPs :
   - siegedbc
   - SiegeAssurnetFront
   - droolslot2
   - siegeawf
   - siegeasdrools
   - siegeaskeycloak
   - siegeasbackend
   - assurnetprod
   - SiegeAssurnetDigitale

### 4. Déployer avec Docker Compose

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 5. Accéder à l'Application

- **Interface Web** : http://your-server-ip
- **API** : http://your-server-ip:5000/api

**Connexion par défaut** :
- Username: `admin`
- Password: `admin123`

⚠️ **Important** : Changez le mot de passe admin immédiatement après la première connexion !

## 🔧 Configuration Post-Installation

### 1. Configurer les Emails (Microsoft 365)

1. Allez dans "Paramètres" → "Configuration Email"
2. Configurez :
   - Serveur SMTP : `smtp-mail.outlook.com`
   - Port : `587`
   - Email : votre email Microsoft 365
   - Mot de passe : utilisez un mot de passe d'application
3. Testez la configuration

### 2. Configurer le Monitoring

1. Dans "Paramètres" → "Configuration du Monitoring"
2. Définissez :
   - Intervalle de vérification (recommandé : 60 secondes)
   - Emails d'alerte
   - Activation des alertes automatiques

### 3. Créer des Utilisateurs

1. Allez dans "Gestion des Utilisateurs"
2. Créez des comptes pour votre équipe
3. Assignez les rôles appropriés :
   - **Admin** : Accès complet
   - **Opérateur** : Monitoring, serveurs, redémarrage, audit
   - **Visualiseur** : Monitoring et audit uniquement

## 📊 Utilisation

### Dashboard
- Vue d'ensemble temps réel de tous les serveurs
- Statistiques de disponibilité
- Alertes visuelles en cas de problème

### Redémarrage de Serveurs
1. Allez dans "Redémarrage"
2. Sélectionnez les serveurs (ou utilisez les sélections rapides)
3. Choisissez entre redémarrage immédiat ou planifié
4. Optionnellement, activez les notifications email

### Monitoring
- Vérification automatique toutes les minutes
- Historique des statuts
- Alertes email automatiques

### Audit
- Consultez tous les logs d'activité
- Exportez les données pour analyse
- Filtrez par utilisateur, action, ou date

## 🔧 Scripts de Gestion

### Démarrer les Services
```bash
docker-compose up -d
```

### Arrêter les Services
```bash
docker-compose down
```

### Voir les Logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
```

### Mise à Jour
```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose down
docker-compose up --build -d
```

### Sauvegarde de la Base de Données
```bash
# Créer une sauvegarde
docker-compose exec mongodb mongodump --db server-monitoring --out /data/backup

# Copier la sauvegarde localement
docker cp $(docker-compose ps -q mongodb):/data/backup ./backup
```

## 📁 Structure du Projet

```
server-monitoring-app/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── contexts/       # Contextes React (Auth, Socket)
│   │   └── ...
│   └── Dockerfile
├── backend/                 # API Node.js
│   ├── models/             # Modèles MongoDB
│   ├── routes/             # Routes API
│   ├── services/           # Services (monitoring, email)
│   ├── middleware/         # Middlewares (auth, etc.)
│   └── Dockerfile
├── docker-compose.yml      # Configuration Docker
├── nginx.conf             # Configuration Nginx
└── README.md
```

## 🔒 Sécurité

- Authentification JWT avec expiration
- Chiffrement des mots de passe avec bcrypt
- Validation des permissions côté serveur
- Rate limiting sur les APIs
- Headers de sécurité avec Helmet
- Logs d'audit complets

## 🚨 Dépannage

### Les serveurs n'apparaissent pas dans le monitoring
1. Vérifiez que les IPs sont correctes
2. Assurez-vous que les serveurs sont marqués comme "actifs"
3. Vérifiez les logs : `docker-compose logs -f backend`

### Les emails ne fonctionnent pas
1. Vérifiez la configuration dans "Paramètres"
2. Utilisez un mot de passe d'application Microsoft 365
3. Testez la connexion avec le bouton "Tester"

### Problèmes de redémarrage SSH
1. Vérifiez que les clés SSH sont montées dans le conteneur
2. Testez la connexion SSH manuellement
3. Vérifiez les permissions des clés SSH

### L'application ne démarre pas
1. Vérifiez que MongoDB est accessible
2. Vérifiez les variables d'environnement
3. Consultez les logs : `docker-compose logs`

## 📞 Support

Pour tout problème ou question :
1. Consultez les logs de l'application
2. Vérifiez la configuration des variables d'environnement
3. Assurez-vous que tous les services Docker sont opérationnels

## 🎯 Migration de votre Script Bash

Cette application remplace complètement votre script bash existant avec :

1. **Interface graphique** au lieu de lignes de commande
2. **Monitoring continu** au lieu de vérifications ponctuelles  
3. **Gestion multi-utilisateurs** avec permissions
4. **Historique et audit** de toutes les actions
5. **Notifications automatiques** par email
6. **Planification** de redémarrages
7. **Sélection flexible** de serveurs

Votre logique de redémarrage existante (groupes, délais, commandes spéciales) est intégralement préservée dans le backend.