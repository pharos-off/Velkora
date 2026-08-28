# Changelog

## 4.5.0 - Mise à niveau P1

### Sécurité et fiabilité

- Correction du fallback d'image qui cherchait l'asset inexistant `assets/icon.png`.
- Utilisation de l'icône existante `assets/icon.ico` avec un chemin `file://` absolu.
- Filtrage des URLs externes avant ouverture par Electron.
- Blocage des navigations externes non autorisées dans la fenêtre principale.
- Ajout de protections contre les traversées de dossiers dans les sauvegardes.
- Vérification des chemins contenus dans les archives ZIP avant extraction.
- Chiffrement centralisé des données d'authentification Microsoft stockées localement.
- Compatibilité conservée avec les anciennes données d'authentification non chiffrées.
- Ajout des canaux IPC manquants dans la whitelist du preload.

### Profils et modpacks

- Ajout des profils isolés avec un dossier de jeu séparé par profil.
- Création automatique des dossiers `mods`, `resourcepacks`, `shaderpacks`, `saves` et `logs` pour chaque instance.
- Ajout de l'import de modpacks au format ZIP.
- Ajout de l'export de modpacks au format ZIP.
- Ajout d'un manifeste JSON dans les modpacks exportés.
- Import limité aux fichiers situés dans `overrides/` pour éviter d'écraser des fichiers sensibles.
- Ajout de l'export et de l'import de profils Velkora au format JSON.
- Validation des noms de profils et limitation de leur longueur.

### Java et lancement Minecraft

- Ajout de l'installation automatique de Java 8, 17, 21 ou 25 via Adoptium.
- Téléchargement et extraction de Java avec progression d'installation.
- Enregistrement automatique du chemin Java installé dans les paramètres.
- Vérification de la version Java requise avant le lancement de Minecraft.
- Blocage du lancement lorsqu'une version Java est absente ou incompatible.
- Conservation de la détection de Java existante.
- Vérification des mods incompatibles avant le lancement selon la version Minecraft et le loader.

### Mods, dépendances et compatibilité

- Conservation et raccordement de l'installation des mods Modrinth.
- Gestion automatique des dépendances obligatoires Modrinth.
- Détection des incompatibilités de version Minecraft et de loader.
- Ajout d'une API IPC de validation complète de compatibilité d'un profil.
- Ajout des gestionnaires manquants `JVMOptimizer`, `GameMonitor` et `ResourcePackManager`.

### Sauvegardes

- Activation des sauvegardes automatiques des mondes.
- Création automatique des dossiers de sauvegarde.
- Arrêt propre du timer de sauvegarde lors de la fermeture du launcher.
- Ajout des contrôles de sauvegarde dans les paramètres.
- Création et affichage de la liste des sauvegardes depuis l'interface.
- Conservation de la limite du nombre de sauvegardes configurée.

### Monitoring et optimisation

- Ajout du monitoring système en temps réel.
- Collecte du taux d'utilisation mémoire et CPU.
- Collecte de la mémoire et du CPU du processus Java/Minecraft détecté.
- Collecte des informations GPU et température CPU lorsqu'elles sont disponibles.
- Ajout des profils JVM `performance`, `balanced` et `low-memory`.
- Génération automatique d'arguments JVM selon la RAM et le nombre de coeurs disponibles.
- Transmission des mises à jour du monitoring au renderer.

### Serveurs et statistiques

- Ajout de la gestion des serveurs favoris.
- Validation des adresses de serveurs favoris.
- Stockage du nom, de l'adresse, de l'icône et de la version d'un serveur favori.
- Remplacement du statut aléatoire des amis par un ping Minecraft réel lorsque leur serveur est connu.
- Enregistrement automatique des sessions Minecraft à la fermeture du jeu.
- Correction du calcul de la dernière partie jouée.
- Correction du calcul des streaks sans modifier l'historique original.
- Ajout de la validation IPC des statistiques et sessions.

### Diagnostics

- Ajout d'un rapport de diagnostic système.
- Inclusion de la version du launcher, du système, de l'architecture, du processeur, de la mémoire et des disques.
- Ajout de l'affichage du diagnostic dans les paramètres.