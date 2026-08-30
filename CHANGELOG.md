# Changelog

## [4.6.0]

### Accueil et interface
- Ajout d’une section “Gestionnaire de profils premium” sur l’accueil.
- Ajout d’une section “Serveurs favoris” sur l’accueil.
- Ajout d’un sélecteur de profil directement sur la page d’accueil.
- Ajout du bouton “Gérer les profils” redirigeant vers la vue Mods.
- Ajout d’une carte d’actions rapides sur l’accueil.
- Ajout d’un affichage plus compact du temps de jeu.
- Ajout d’une animation légère au survol des profils.
- Amélioration de la lisibilité des cartes de l’accueil.
- Amélioration de la cohérence entre l’accueil et la gestion des profils.

### Sécurité et fiabilité
- Correction du fallback d’image qui pointait vers un asset absent.
- Utilisation de l’icône existante du launcher avec un chemin absolu compatible Electron.
- Blocage des liens externes non autorisés dans la fenêtre principale.
- Filtrage des URLs avant ouverture dans le navigateur système.
- Protection supplémentaire contre les traversées de dossiers dans les sauvegardes.
- Vérification des chemins contenus dans les archives ZIP avant extraction.
- Chiffrement centralisé des données d’authentification Microsoft stockées localement.
- Compatibilité avec les anciennes données non chiffrées conservée.
- Ajout des canaux IPC manquants dans la whitelist du preload.

### Gestionnaire de profils
- Ajout d’un système de profils séparés avec dossier de jeu dédié par profil.
- Création automatique des dossiers `mods`, `resourcepacks`, `shaderpacks`, `saves` et `logs` par instance.
- Ajout de l’import de modpacks au format ZIP.
- Ajout de l’export de modpacks au format ZIP.
- Ajout d’un manifeste JSON dans les modpacks exportés.
- Import limité aux fichiers présents dans `overrides/` pour éviter d’écraser des éléments sensibles.
- Ajout de l’export et de l’import de profils Velkora au format JSON.
- Validation des noms de profils et limitation de la longueur.
- Correction du comportement où le changement de profil ouvrait les paramètres au lieu d’appliquer le profil.
- Correction de la boucle de rechargement infini pendant le changement de profil.

### Java et lancement Minecraft
- Ajout de l’installation automatique de Java 8, 17, 21 et 25 via Adoptium.
- Téléchargement et extraction de Java avec progression d’installation.
- Enregistrement automatique du chemin Java installé dans les paramètres.
- Vérification de la version Java requise avant le lancement.
- Blocage du lancement si Java est absent ou incompatible.
- Détection de Java conservée et renforcée.
- Vérification des mods incompatibles avant le lancement selon la version du jeu et le loader.

### Mods et compatibilité
- Raccordement de l’installation des mods depuis Modrinth.
- Gestion automatique des dépendances obligatoires Modrinth.
- Détection des incompatibilités entre version Minecraft et loader.
- Ajout d’une validation IPC complète de compatibilité d’un profil.
- Ajout des gestionnaires manquants `JVMOptimizer`, `GameMonitor` et `ResourcePackManager`.

### Sauvegardes
- Activation des sauvegardes automatiques des mondes.
- Création automatique des dossiers de sauvegarde.
- Arrêt propre du timer de sauvegarde à la fermeture du launcher.
- Ajout des contrôles de sauvegarde dans les paramètres.
- Création et affichage de la liste des sauvegardes dans l’interface.
- Conservation de la limite configurée du nombre de sauvegardes.
- Protection supplémentaire contre les traversées de dossiers dans les sauvegardes.

### Monitoring et optimisation
- Ajout du monitoring système en temps réel.
- Collecte du taux d’utilisation mémoire et CPU.
- Collecte de la mémoire et du CPU du processus Java/Minecraft détecté.
- Collecte des informations GPU et température CPU lorsque disponibles.
- Ajout des profils JVM `performance`, `balanced` et `low-memory`.
- Génération automatique d’arguments JVM selon la RAM et le nombre de coeurs disponibles.
- Transmission des mise à jour du monitoring au renderer.

### Serveurs et statistiques
- Ajout de la gestion des serveurs favoris.
- Validation des adresses de serveurs favoris.
- Stockage du nom, adresse, icône et version d’un serveur favori.
- Remplacement du statut aléatoire des amis par un ping Minecraft réel quand le serveur est connu.
- Enregistrement automatique des sessions Minecraft à la fermeture du jeu.
- Correction du calcul de la dernière session jouée.
- Correction du calcul des streaks sans modifier l’historique original.
- Ajout de la validation IPC des statistiques et sessions.
- Correction du temps de jeu affiché sur l’accueil pour qu’il corresponde au total des statistiques.
- Correction de l’écart entre le temps de jeu affiché dans les statistiques et celui visible sur la page d’accueil.

### Diagnostics
- Ajout d’un rapport de diagnostic système.
- Inclusion de la version du launcher, du système, de l’architecture, du processeur, de la mémoire et des disques.
- Ajout de l’affichage du diagnostic dans les paramètres.
- Ajout d’un contrôle de santé du jeu pour vérifier l’état du dossier de jeu.
- Ajout d’une réparation rapide du jeu en cas de problème détecté.
- Ajout de diagnostics internes plus visibles pour le launcher.

### Corrections générales
- Correction du mauvais comportement où le clic sur un profil ouvrait les paramètres du launcher au lieu de le sélectionner.
- Correction de la boucle de rechargement qui pouvait provoquer un “Chargement…” infini.
- Correction de la sélection de profil pour qu’elle s’applique correctement à la vue Mods et au profil actif global.
- Correction du rendu visuel des cartes d’accueil pour éviter les éléments incohérents.
- Correction de la logique de mise à jour des informations de session.
- Correction du calcul des temps et statistiques d’activité globale.

### Intégration et stabilité
- Suppression de l’intégration CurseForge conformément à la demande de ne pas dépendre d’une API externe.
- Maintien d’un launcher autonome sans dépendance supplémentaire externe pour les fonctionnalités principales.
- Renforcement de l’expérience utilisateur sans ajouter de services tiers lourds.
- Mises à jour visuelles de l’interface pour un rendu plus premium et plus propre.
- Nettoyage des éléments visuels inutiles et amélioration des sections d’information du launcher.