# Changelog

## [4.7.0] - Sécurisation, onboarding et stabilisation du launcher

### [Sécurité]
- Renforcement du bridge IPC et du preload Electron pour limiter les canaux accessibles depuis le renderer.
- Blocage explicite des payloads trop volumineux et des listeners non autorisés côté preload.
- Protection supplémentaire du flux Microsoft OAuth : validation, nettoyage, normalisation et suppression propre des sessions invalides.
- Durcissement du stockage des jetons et des données d’authentification avec normalisation des objets authData avant sauvegarde et lecture.
- Suppression automatique des sessions corrompues ou expirées lors des échecs de refresh de token.
- Consolidation de la couche de sécurité autour du store applicatif et des données sensibles localement stockées.
- Vérification plus stricte des données de session avant utilisation dans le flux de lancement et de refresh.
- Ajout de garde-fous sur l’état de l’authentification pour éviter les fenêtres, promesses ou sessions incohérentes.

### [Fonctionnalités & UX]
- Ajout du parcours de premier démarrage avec statut explicite et persistance dans les réglages de l’application.
- Définition d’un état de wizard cohérent pour distinguer configuration initiale et configuration déjà validée.
- Intégration de diagnostics runtime dans les données globales envoyées au renderer et dans les rapports système.
- Ajout des IPC `get-runtime-diagnostics`, `get-first-run-status` et `complete-first-run` pour exposer ces informations de manière sécurisée.
- Amélioration du diagnostic système global avec inclusion du runtime applicatif, mémoire, architecture, système et environnement technique.
- Ajout d’un mécanisme de mise à jour plus visible et mieux intégré dans le flux applicatif.
- Renforcement des écrans de chargement et de réussite / échec de l’authentification Microsoft pour mieux guider l’utilisateur.
- Amélioration de la cohérence de l’interface et des parcours de configuration lors des premières utilisations.
- Préparation de l’interface pour exposer plus clairement les états de santé, de diagnostic et d’onboarding à l’utilisateur.