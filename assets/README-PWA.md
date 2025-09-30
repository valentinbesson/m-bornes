# M-Bornes - Progressive Web App (PWA)

## 🎯 Votre application est maintenant une PWA !

Votre compteur Mille Bornes est désormais une Progressive Web App complète avec les fonctionnalités suivantes :

## ✨ Nouvelles fonctionnalités PWA

### 📱 Installation sur l'appareil
- **Sur mobile** : Appuyez sur "Ajouter à l'écran d'accueil" dans votre navigateur
- **Sur desktop** : Cliquez sur l'icône d'installation dans la barre d'adresse
- **Chrome/Edge** : Cherchez le bouton "Installer M-Bornes" dans la barre d'adresse

### 🔌 Fonctionnement hors ligne
- L'application fonctionne complètement sans connexion internet
- Tous vos scores et parties sont sauvegardés localement
- Les images et ressources sont mises en cache automatiquement

### 🎨 Interface native
- Se lance en plein écran comme une vraie app
- Icône personnalisée sur l'écran d'accueil
- Couleurs de thème correspondant à votre design

## 🚀 Comment tester votre PWA

### 1. Serveur local (en cours)
Votre serveur est déjà lancé sur : **http://localhost:8080**
- Ouvrez cette URL dans votre navigateur
- Vous devriez voir l'icône d'installation apparaître

### 2. Vérification des fonctionnalités PWA

#### Dans Chrome DevTools :
1. Ouvrez `F12` → Onglet "Application"
2. Vérifiez :
   - **Manifest** : Doit afficher les infos de votre app
   - **Service Workers** : Doit être "activé" 
   - **Storage** : Cache rempli avec vos fichiers

#### Test hors ligne :
1. Dans DevTools → Onglet "Network"
2. Cochez "Offline"
3. Rechargez la page → L'app doit encore fonctionner !

### 3. Installation mobile
Pour tester sur mobile :
1. Ouvrez http://[VOTRE_IP]:8080 sur votre téléphone
2. Dans Chrome mobile : Menu → "Ajouter à l'écran d'accueil"
3. L'app s'installera comme une vraie application

## 📁 Fichiers PWA ajoutés

```
m-bornes/
├── manifest.json          # Configuration PWA
├── sw.js                 # Service Worker (cache hors ligne)
└── assets/icons/         # Icônes de l'application
    ├── icon.svg          # Icône source SVG
    └── icon-*.png        # Icônes aux différentes tailles
```

## 🔧 Modifications apportées

### index.html
- Ajout des meta tags PWA
- Référence au manifest.json
- Icônes Apple Touch

### script.js  
- Enregistrement du service worker
- Gestion des mises à jour automatiques

## 🎯 Pour aller plus loin

### Icônes personnalisées
Remplacez les fichiers `assets/icons/icon-*.png` par vos propres icônes aux bonnes dimensions :
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 pixels

### Déploiement
Pour déployer votre PWA :
1. **GitHub Pages** : Push sur GitHub + activer Pages
2. **Netlify** : Drag & drop votre dossier
3. **Vercel** : Import depuis GitHub

⚠️ **Important** : Les PWA nécessitent HTTPS en production (GitHub Pages/Netlify/Vercel le fournissent automatiquement)

## 🎮 Profitez de votre PWA M-Bornes !

Votre jeu Mille Bornes est maintenant une vraie application que vos utilisateurs peuvent installer et utiliser hors ligne ! 🚗💨