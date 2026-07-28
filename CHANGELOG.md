# Changelog

## 2026-07-28 — Corrections et améliorations

- Correction (page loader): le loader restait bloqué sur "Chargement..." lors de navigations rapides entre onglets. Maintenant le loader est bien annulé et forcé à disparaître si nécessaire.
- UX (navigation): les onglets du sidebar sont désactivés dès le clic pour éviter les doubles ou clics concurrents, puis réactivés une fois la page chargée.
- Robustesse offline: ajout d'un fallback global pour les images qui échouent (remplacement par `assets/icon.png`), garantissant l'affichage des icônes hors réseau.
- Confidentialité: l'ID utilisateur dans les paramètres est maintenant masqué par défaut (affichage sur une seule ligne avec un bandeau flou), et un petit bouton permet de le révéler temporairement.
- Localisation: traduction des onglets des paramètres en français.

- Temps de jeu: ajout d'un suivi du "Temps de jeu total" affiché dans l'accueil. Le temps est persisté en millisecondes dans `localStorage` (`velkora_total_playtime_ms`), un timestamp de démarrage (`velkora_game_start_ts`) est enregistré au lancement, et la durée courante est cumulée au retour du signal `game-closed`. L'affichage live est mis à jour chaque seconde dans l'élément `#total-playtime-value`.

Fichiers modifiés:
- `src/renderer/PageLoader.js` — annulation/force-hide et annulation des animations.
- `src/renderer/app.js` — désactivation des onglets au clic, fallback images global.
- `src/renderer/settings-app.js` — overlay flou et bouton de révélation pour l'ID, traductions.

- `src/renderer/app.js` — ajout du suivi du temps de jeu (helpers `getTotalPlaytimeMs`, `setTotalPlaytimeMs`, `startPlaytimeTracking`, `stopPlaytimeTracking`, `updatePlaytimeDisplay`), intégration au `launchGame` et au listener `game-closed`, et ajout de l'élément `#total-playtime-value` dans l'UI.

Détails techniques et autres modifications:

- Navigation / UI:
	- `viewChangeListener` dans `src/renderer/app.js` : application immédiate du style "désactivé" au clic (grisé), puis navigation dans un double `requestAnimationFrame` + lecture de layout pour forcer le paint avant exécution du rendu lourd. Cela corrige les délais observés sur "Accueil".

- Page loader:
	- `src/renderer/PageLoader.js` : améliorations de l'annulation et comportement "force-hide" pour éviter que l'écran de chargement reste bloqué lors de navigations rapides ou rendus concurrents.

- Statistiques et Temps de jeu:
	- Ajout d'un suivi persistant du "Temps de jeu total" (`velkora_total_playtime_ms`) et d'un timestamp de démarrage (`velkora_game_start_ts`). Le suivi est démarré au lancement (`launchGame`) et cumulé au retour de l'événement `game-closed`.
	- Nouvelle vue native `Statistiques` via `renderStatsView()` dans `src/renderer/app.js` : affiche `Temps de jeu total`, `Dernière connexion`, `Jeu en cours`, `Statut réseau` et se met à jour en temps réel (intervalle 1s).
	- Bouton `Réinitialiser` ajouté à la vue Statistiques : confirmation via la boîte de dialogue (`ui.showConfirm`) puis remise à zéro des compteurs et arrêt du tracking. Handler exposé publiquement (`handleStatsReset()`) et sécurisé pour éviter les doublons.

- Paramètres / Confidentialité:
	- `src/renderer/settings-app.js` : affichage masqué de l'ID utilisateur (single-line + overlay flou) avec petit bouton pour révélation temporaire.

- Robustesse offline:
	- Fallback global pour toutes les images externes : en cas d'erreur, les images utilisent `assets/icon.png` pour garantir l'affichage hors réseau (`src/renderer/app.js`).

- IPC / sécurité:
	- `src/main/preload.js` : ajout du canal `update-profile-loader` à la whitelist `INVOKE_ALLOWED`, permettant à `src/renderer/ModsManager.js` d'appeler `ipcRenderer.invoke('update-profile-loader', ...)` sans être bloqué.