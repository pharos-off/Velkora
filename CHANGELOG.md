## Journal des modifications

### [4.2.0] - 2026-04-22

- Correction : le chargement de la fenêtre de démarrage a été corrigé pour utiliser `renderer/index.html` (ReferenceError résolu).
- Correction : suppression de la petite fenêtre dupliquée au démarrage — la fenêtre principale s'affiche immédiatement.
- Amélioration : optimisations du renderer pour les performances (pause/reprise au changement de visibilité, fréquence d'images adaptative, réduction du nombre de particules, limitation des événements, mises à jour DOM groupées).
- Correction : ajout de gestionnaires pour les crashs/non-réponse du renderer afin de tenter des rechargements propres.
- Correction : forcer l'utilisation de `javaw` et masquer la console sur Windows lors du lancement (normalisation du chemin Java et patch temporaire de `spawn` pendant le lancement).
- Correction : empêcher le relancement immédiat après la fermeture du jeu (garde de 10 s).
- Divers : ajout de logs pour le binaire Java effectif et amélioration de la gestion des erreurs de lancement.
- Ajout d'un nouveau systeme de Versions*
- Et encore bien d'autres !