# Zombidoku

Une recréation d'un jeu mobile de puzzle logique à la **Meowdoku**, jouable
sur **iOS**, **Android** et **Web** à partir d'une seule base de code (Expo /
React Native + React Native Web).

**Note sur le thème** : le prototype initial reprenait fidèlement le thème
chat de Meowdoku (voir l'analyse ci-dessous, conservée telle quelle pour la
traçabilité). Le jeu a ensuite été rebaptisé **Zombidoku** et entièrement
rethémé — palette nuit/vert toxique, mascotte zombie, monnaie "cerveaux" 🧠,
streak "nuits survécues" 🌙 — pour se différencier visuellement de
l'original et donner un ressort comique propre à la règle du jeu ("les
zombies ne se touchent pas... ou ils se multiplient"). Toutes les mécaniques
de puzzle (§1) restent identiques ; seuls l'habillage et les noms ont changé
(détaillés en §1 sous "Compagnon, mode Zen, mode chrono, publicités
récompensées" et dans la table des écrans).

## 1. Analyse du jeu original

D'après les captures d'écran fournies (écran d'accueil, écran de partie
niveau 1 en 4×4, niveau 4 en 6×6, modale de profil, écran de série
quotidienne), voici la mécanique et les écrans identifiés.

### Le puzzle : une variante de "Star Battle" / "Queens"

La grille NxN est découpée en **N régions de couleur**. Le but est de placer
un chat 🐱 par case de façon à respecter **trois règles simultanément**,
rappelées en permanence sous forme de mini-cartes pédagogiques pendant la
partie :

1. **1 chat par couleur** — une seule région de couleur ne peut contenir
   qu'un seul chat.
2. **1 chat par ligne et colonne** — comme dans un sudoku/les échecs, une
   seule ligne et une seule colonne ne peuvent contenir qu'un seul chat.
3. **Les chats ne peuvent pas se toucher** — même en diagonale (règle du
   roi aux échecs : distance de Tchebychev ≥ 2 entre deux chats).

C'est exactement la mécanique du jeu **Queens** (popularisé par LinkedIn) :
un cas particulier de "Star Battle" à une étoile, où les régions colorées
remplacent les contraintes géométriques pures. Meowdoku l'habille d'un
thème mignon (chats, poissons, avatars d'animaux) et d'une méta-couche de
progression (niveaux, score, série quotidienne, monnaie).

**Pourquoi ça fonctionne bien**, du point de vue design :

- **Trois règles simples, apprises en 10 secondes**, mais dont la
  combinaison crée une vraie profondeur de déduction logique — la même
  formule qui a rendu Queens viral.
- **Feedback immédiat, avec un vrai enjeu** : un tap simple ne fait que
  noter/effacer une exclusion (✕), sans risque — c'est l'espace pour
  déduire. Un double-tap engage réellement un zombie sur la case : correct,
  il se pose ; incorrect, la case est marquée ✕ (on sait maintenant que ce
  n'est pas là) et coûte une vie 🧠 parmi les 3 disponibles par niveau. Ce
  découplage "noter sans risque / valider avec risque" est ce qui rend la
  logique déductive gratifiante plutôt que punitive.
- **Difficulté progressive lisible** : la grille grandit avec le niveau
  (4×4 → 16×16 dans cette recréation, chaque palier de taille durant un
  niveau de plus que le précédent), donnant une sensation de progression
  sans changer les règles.
- **Boucle de méta-jeu courte** : score cumulé, cerveaux 🧠 (monnaie) et
  power-ups (zombie auto-placé, ampoule d'indice) créent une petite économie
  qui récompense la persévérance sans bloquer la partie.
- **Rituel de rétention** : l'écran "Touchez la lune, survivez à la
  nuit !" est un mécanisme de streak quotidien classique (type Duolingo),
  qui ramène le joueur chaque jour indépendamment de la difficulté du
  niveau en cours. Le défi quotidien (9×9, débloqué au niveau 21) est le
  même mécanisme sous une autre forme : une seule tentative par jour, la
  même grille pour tout le monde, qui donne une raison de revenir même
  après avoir fini sa session de niveaux.
- **Identité ludique et non punitive** : avatars/cadres à débloquer, thème
  nocturne un peu absurde, palette nuit/vert toxique — le jeu reste accessible et "cosy"
  même quand le puzzle devient dur.

### Écrans reconstitués

| Écran | Éléments identifiés |
|---|---|
| **Accueil** | Logo "ZOMBIDOKU", bouton avatar (haut gauche), bouton réglages (haut droit), carte "Alerte zombie" (🔒 avant le niveau 21, 🎯 débloquée, ✅ si déjà réussie aujourd'hui), carte "Nuits" (streak), bannière compagnon (emoji + XP + accessoire équipé), bouton "Niveau N" |
| **Partie** | Barre du haut (retour / Niveau / Score / réglages), badge de progression 🧟 x/N, badge vies 🧠 (3 par niveau) ou badge 🧘 Zen, chronomètre optionnel, 3 cartes de règles, grille de jeu, boutons de power-up (↩ annuler, 🧟 auto-placement, 💡 indice, 📺 pub — natif uniquement) |
| **Profil** | Avatar + identifiant joueur, onglets Avatar/Cadre, grille de sélection, bouton Confirmer |
| **Compagnon** | Zombie + accessoire équipé, barre de progression XP, bouton "Nourrir", grille d'accessoires (déblocable/équipable) |
| **Série quotidienne** | Lune à toucher, compteur de nuits, message de confirmation |
| **Réglages** | Sons, Musique, Vibrations, Mode Zen, Mode chrono |

### Interaction sur la grille

- **Tap simple** : bascule la case entre vide et exclue (✕ blanche).
  Purement une note pour le joueur, sans conséquence — c'est là qu'on pose
  ses déductions avant de s'engager.
- **Appui maintenu + glissement** : peindre plusieurs cases d'un seul
  geste. Le mode (ajouter ou retirer des ✕) est déterminé par l'état de la
  *première* case touchée — vide au départ : chaque case survolée sans ✕ en
  reçoit une (celles qui en ont déjà une ne sont pas touchées) ; ✕ au
  départ : chaque case survolée qui a une ✕ la perd (les cases déjà vides
  restent vides). Un tap simple n'est qu'un glissement de longueur nulle
  dans ce modèle, donc le même code gère les deux. Techniquement, tout le
  geste tactile de la grille est capté par un unique `PanResponder` au
  niveau du `Board` (plutôt que des `Pressable` par case) : le système de
  gestes de React Native verrouille un geste sur la première vue qui le
  capte et continue de lui envoyer les événements même quand le doigt
  glisse sur des cases voisines, donc des `Pressable` individuels ne
  verraient jamais un glissement commencé ailleurs.
- **Double-tap** : engage un zombie sur la case. S'il y a effectivement un
  zombie à cet endroit dans la solution, il se pose (🧟). Sinon, la case
  reçoit une ✕ **rouge, définitive** — elle ne peut plus jamais être
  modifiée, ni par un tap simple ni par un nouveau double-tap — et le
  joueur perd une vie parmi les 3 disponibles pour ce niveau (affichées en
  🧠 en haut de l'écran). L'erreur déclenche aussi une petite vibration
  (haptique, désactivable dans les réglages) et une légère secousse de
  l'écran. À 0 vie, le niveau est raté et propose de réessayer (nouvelle
  grille de la même taille) ou de retourner à l'accueil.
- **Bruitages** (désactivables via "Sons" dans les réglages) : de vrais
  enregistrements CC0 (domaine public, aucune attribution requise, crédits
  dans `assets/sounds/CREDITS.md`) — grognements de zombie (pack
  "Zombies Sound Pack", OpenGameArt) pour un zombie posé, une erreur, la
  victoire et la défaite, et un petit clic (Kenney "Interface Sounds") à
  chaque ✕ posée. Les fichiers sont convertis en WAV 16 bits mono pour
  rester lisibles sur iOS comme sur Android.
- **Célébration** : un zombie correctement deviné (par double-tap, pas par
  le raccourci 🧟 payant) fait apparaître brièvement "👏 Excellent ! 👏" (ou
  Génial/Incroyable/Bravo/Parfait/Superbe, choisi au hasard) juste
  au-dessus de la grille.
- **Révélation du niveau** : à l'arrivée sur un niveau (ou au
  "Réessayer"), les cases apparaissent en vague décalée plutôt que
  d'un coup, pour marquer visuellement le début d'une nouvelle grille.
- **Boutons** : tous les boutons de l'app (accueil, barre du jeu,
  modales) rétrécissent légèrement au toucher et rebondissent au
  relâchement (`PressableScale`), au lieu du simple changement d'opacité
  par défaut.
- Les power-ups (🧟 auto-placement, 💡 indice) restent des raccourcis
  payants (cerveaux 🧠 de la monnaie du joueur) qui ne coûtent jamais de
  vie.

### Défi quotidien et série

Les deux mécanismes de rétention quotidienne sont pleinement fonctionnels :

- **Série** ("Touchez la lune...") : un tap par jour sur la lune
  incrémente la série si le dernier tap datait d'hier, sinon la remet à 1.
  Persistée (`streak`, `bestStreak`, `lastStreakClaimDate`) via
  `AsyncStorage`.
  - **Calendrier de bonus** (`utils/streakRewards.ts`) : au-delà des 2 🧠
    plats de chaque nuit, certaines nuits de la série rapportent un bonus
    (une charge 🦇/💡/🧟 ou des 🧠 en plus), sur un rythme volontairement
    *croissant mais mesuré* — les paliers s'espacent de plus en plus
    (nuit 2, 3, 5, 7, 10, 14, 21, 30, puis tous les 7 jours au-delà) tandis
    que la récompense grossit à chaque palier, plutôt que d'enchaîner les
    bonus de plus en plus vite. La modale de série (`StreakModal.tsx`)
    affiche un mini calendrier des 7 prochaines nuits avec le logo du bonus
    sur celles qui en ont un, plus un texte "Prochain bonus dans N nuits" ;
    la carte "Nuits" de l'accueil affiche un aperçu du même calcul sans
    avoir à ouvrir la modale.
- **Défi quotidien** : débloqué au niveau 21 (carte "Alerte zombie" sur
  l'accueil, verrouillée 🔒 avant, cible 🎯 après). C'est une grille 9×9
  **identique pour tous les joueurs** un jour donné, générée par une seed
  dérivée de la date (`utils/dailyChallenge.ts` + `utils/seededRandom.ts`,
  un PRNG mulberry32 seedé par un hash de `YYYY-MM-DD`). Une seule
  tentative comptée par jour ; réussir marque
  `dailyChallengeCompletedDate` à aujourd'hui (le ✅ remplace le 🎯 sur
  l'accueil) et rapporte 10 🧠 plus un score, sans faire avancer le niveau
  du joueur. Réessayer après un échec régénère *la même* grille (seed
  identique), pas une nouvelle. Une fois le défi du jour réussi, rouvrir
  la carte affiche un écran "déjà réussi" à la place de la grille plutôt
  que de permettre une deuxième tentative.
  - **Piège de déterminisme évité** : `generatePuzzle` (utilisé pour les
    niveaux normaux) borde sa recherche d'unicité par une échéance
    d'horloge murale (`Date.now()`), ce qui la rend rapide pour jouer mais
    *non reproductible* — avec la même seed, deux exécutions peuvent
    tomber sur un résultat différent selon le temps CPU réellement
    écoulé (vérifié empiriquement : ce n'était pas qu'un risque
    théorique). Le défi quotidien utilise donc
    `generatePuzzleDeterministic`, une variante qui ne borne jamais rien
    par le temps — seulement par un nombre de tentatives — pour que le
    résultat ne dépende que de la seed, jamais de la machine ou du
    moment de génération.

### Compagnon, mode Zen, mode chrono, publicités récompensées

- **Compagnon persistant** (`utils/companion.ts`, `CompanionModal.tsx`) —
  la fonctionnalité différenciante : un zombie qu'on nourrit avec les
  cerveaux 🧠 (2 🧠 → +10 XP), qui monte de niveau et change d'emoji à
  travers 6 paliers (🧟 → 🧟‍♂️ → 🧟‍♀️ → 👹 → 👺 → 🧌), plus 5 accessoires
  cosmétiques déblocables et équipables (nœud, lunettes, écharpe, fleur,
  couronne) affichés à côté du compagnon. Bannière tappable sur l'accueil,
  écran complet en modale. Ça donne une utilité à la monnaie au-delà du
  shop indice/auto-placement, et une raison de revenir qui n'est ni un
  niveau ni un défi chronométré.
- **Mode Zen** (réglage, off par défaut) — désactive les vies pour les
  niveaux normaux : une mauvaise case est toujours marquée ✕ rouge et
  verrouillée (le retour visuel reste utile), mais ne coûte plus de vie et
  ne peut plus faire perdre la partie. Ne s'applique jamais au défi
  quotidien, qui doit garder son enjeu de tentative unique.
- **Annuler** (bouton ↩ à côté des power-ups, toujours gratuit) — annule
  le dernier geste (un tap, un glissé entier, ou un double-tap raté) et
  restaure la grille *et* les vies à leur état d'avant ce geste. Un geste
  qui n'a rien modifié (case déjà verrouillée) n'est pas empilé dans
  l'historique.
- **Mode chrono** (réglage, off par défaut) — affiche un chronomètre
  pendant la partie et garde le meilleur temps par taille de grille
  (`bestTimeBySize`), affiché dans la modale de victoire avec "🏆 Nouveau
  record !" le cas échéant.
- **Publicités récompensées, par bonus** (`utils/ads.ts`) — chacun des 3
  power-ups a son propre déclencheur de pub plutôt qu'un bouton 📺 partagé :
  une fois ses charges épuisées, son badge rouge devient un "▶" vert
  (`PowerButton`, `badgeVariant="ad"`) ; un tap lance une pub récompensée
  qui, en cas de succès, recharge *et* exécute directement ce bonus précis
  (niveaux normaux uniquement, masqué sur web où le fallback reste
  d'acheter la charge avec des 🧠).
  - **Sur iOS/Android** (`utils/ads.ts`) : vrai SDK `react-native-google-mobile-ads`,
    branché sur les identifiants de test publics de Google
    (`TestIds.REWARDED`, voir `src/config/adIds.js` et son flag
    `USE_TEST_ADS`) tant que les vraies apps/blocs AdMob n'existent pas.
    Ce fichier est volontairement séparé par plateforme (`ads.ts` +
    `ads.web.ts`, résolus automatiquement par Metro) plutôt qu'un simple
    `if (Platform.OS === 'web')` : un des modules du SDK importe des
    internes natifs de React Native que Metro refuse carrément de bundler
    pour le web, avant même l'exécution — un `import()` dynamique ne
    suffit pas à éviter ça, contrairement au cas de
    `expo-tracking-transparency` juste en dessous. Passer aux vraies
    pubs une fois les identifiants créés : remplir
    `ANDROID_REWARDED_UNIT_ID`/`IOS_REWARDED_UNIT_ID` dans
    `src/config/adIds.js` et passer `USE_TEST_ADS` à `false`.
  - **Sur web** (`utils/ads.web.ts`) : aucun SDK pub ne tourne dans un
    navigateur, donc **mock** — `showRewardedAd` y simule la même forme
    asynchrone "charger → afficher → récompenser" qu'un vrai SDK.
  - **App Tracking Transparency** (`utils/tracking.ts`, iOS uniquement) —
    demandée une fois avant la première pub. Ce module-là utilise un
    `import()` dynamique (suffisant dans son cas, car son code ne touche
    pas d'internes React Native au niveau module) plutôt que le
    découpage par fichier de plateforme.
- **Indice 💡 par déduction logique** (`engine/deduction.ts`) — l'indice ne
  révèle plus directement une case de la solution cachée : il assombrit
  l'écran et met en surbrillance uniquement ce qu'un joueur attentif aurait
  pu trouver lui-même, avec un bouton "Appliquer" pour le poser à sa place
  (et "Fermer" pour l'ignorer). Deux techniques de déduction, à un seul
  niveau de chaînage (pas un solveur complet) :
  1. toute case vide qui partage une ligne/colonne/cimetière avec un
     zombie déjà posé, ou qui lui est adjacente, peut être marquée ✕ ;
  2. une fois ces exclusions comptées, si une ligne/colonne/cimetière n'a
     plus qu'une seule case candidate, cette case est forcément le zombie
     (un "single caché", la même logique qu'au Sudoku).

  Vérifié par un script de stress-test autonome (30 tirages, tailles 6 à
  10) avant toute intégration UI : zéro fausse suggestion de ✕, zéro case
  de zombie incorrecte, un placement forcé trouvé dans 87 % des cas. Sur
  les board states où rien n'est déductible dans l'immédiat (~13 % des cas
  testés), l'indice retombe sur l'ancien comportement (révéler une case de
  la solution) plutôt que de ne rien faire pour la charge dépensée.
- **Bonus chauve-souris 🦇** (remplace la "souris" de l'original — le jeu
  de mots "chat qui chasse la souris" ne survit pas au rebrand zombie,
  alors qu'une chauve-souris nocturne colle mieux au thème, et c'est déjà
  l'un des 8 avatars) — pose 3 ✕ sur des cases vides tirées au hasard parmi
  celles réellement fausses pour leur ligne. Une chauve-souris apparaît en
  rebondissant sur chaque case (`CritterPop` dans `Cell.tsx`) puis
  s'efface, laissant place à la croix, l'une après l'autre plutôt que les
  3 en même temps.

### Récompenses et tombeaux

- **Fin de niveau** (`utils/rewards.ts`) : des cerveaux 🧠 plus une chance de
  bonus (💡 🧟 🦇) qui grandit avec la difficulté : facile 3 🧠 / 15 %, moyen
  4 🧠 / 30 %, difficile 6 🧠 / 55 %, expert 8 🧠 + 1 bonus garanti (25 %
  d’un second). Un niveau boss donne toujours au moins un bonus et 50 % de
  cerveaux en plus ; l’Alerte zombie en donne aussi un.
- **Tombeaux** (`TombsModal.tsx`, bouton 🪦 de l’accueil) : un **tombeau** gratuit
  par jour, 3 autres contre une pub récompensée (mobile seulement) ou 8 🧠 ;
  un **cercueil** une fois par jour contre une pub, ou 30 🧠. Un tombeau
  donne toujours 1 bonus + 3 à 5 🧠 et un cercueil 2 bonus + 20 à 26 🧠 ;
  comme un bonus vaut environ 6 🧠, ce qu’on obtient vaut toujours plus que
  ce qu’on a payé. Les probabilités sont affichées à l’écran et les compteurs
  se remettent à zéro chaque jour. Pas d’achat intégré pour l’instant : il
  faudrait des produits configurés dans les stores et l’affichage des
  probabilités exigé par Apple/Google pour les contenus aléatoires payants.

### Animations

- **`react-native-reanimated` écarté** : installé un temps pour les
  animations pilotées par les gestes, il a été retiré après un vrai
  conflit de peer dependency à l'installation (`react-native-worklets`
  4.x vs. la version que `expo-modules-core` de ce SDK attend) — un
  risque de casser un build natif que je ne peux pas vérifier ici (pas
  d'Xcode/Android Studio/appareil dans cet environnement). Les animations
  pilotées par état (révélation de grille, secousse d'erreur, pression des
  boutons, pulsation d'indice) restent sur l'API `Animated` native de React
  Native — sans dépendance native supplémentaire, donc sans ce risque, et
  déjà largement suffisante pour des sprints/boucles/interpolations.
- **`lottie-react-native`** ajouté pour les moments "en boîte" que
  `Animated` ne fait pas bien : un burst de confettis à la victoire
  (`assets/lottie/confetti.json`) et un petit cœur qui apparaît quand le
  compagnon est nourri (`assets/lottie/heart-pop.json`). Les deux fichiers
  sont **générés par un script** (`scripts/generate-lottie.mjs`, à relancer
  après modif) plutôt que téléchargés depuis LottieFiles ou équivalent —
  les animations communautaires ont des licences très variables, donc même
  principe que pour les sons synthétisés (§1) : rien à attribuer, rien à
  vérifier légalement avant publication sur les stores.
  - **Limite connue de la vérification web** : le rendu web de Lottie
    (`@lottiefiles/dotlottie-react`, utilisé en interne par
    `lottie-react-native` sur cette plateforme) charge un moteur WASM
    depuis un CDN au premier rendu. Le proxy réseau de cet environnement
    de développement bloque ce CDN (politique de l'organisation, hors de
    mon contrôle), donc je n'ai pas pu vérifier visuellement le rendu des
    confettis/du cœur ici — seulement que l'app ne plante pas et que le
    reste du flux (modale de victoire, alimentation du compagnon)
    fonctionne normalement pendant que l'animation échoue silencieusement
    en arrière-plan. Ça ne devrait affecter ni le web déployé (accès
    réseau normal pour un vrai visiteur) ni le natif (moteur Lottie natif
    embarqué dans le binaire, aucune dépendance réseau).
- **Révélation de grille** (`Board.tsx`) : en plus du fondu/zoom existant,
  les cases montent légèrement en apparaissant (`translateY`), un clin
  d'œil au thème — elles ont l'air de sortir de terre plutôt que de juste
  apparaître.
- **Pulsation d'indice** (`Cell.tsx`) : l'anneau de surbrillance d'une
  déduction respire (opacité en boucle) au lieu d'être une bordure
  statique — vert pour un ✕ déductible, jaune pour la case du zombie —
  beaucoup plus visible sur une grande grille chargée. Les cases hors
  surbrillance reçoivent un voile sombre individuel (`dimmed`) plutôt
  qu'un unique calque plein écran, pour approximer l'effet "l'écran
  s'assombrit" sans passer par un masque SVG ou un portail de vue.
- **Entrée de la modale de victoire** : la carte apparaît avec un petit
  effet ressort (échelle + fondu) synchronisé avec le burst de confettis,
  plutôt que de juste apparaître d'un coup avec le fondu natif de la
  `Modal`.

## 2. Choix techniques

**Expo (React Native + React Native Web) en TypeScript** : une seule base
de code compile nativement vers iOS, Android *et* Web, ce qui correspond
exactement à la demande. Alternatives écartées : une PWA seule (pas d'app
store natif) ou deux bases séparées (natif + web) qui auraient dupliqué
toute la logique de puzzle.

- **Zustand** (+ persistance `AsyncStorage`, compatible web) pour l'état
  global : progression, score, monnaie, power-ups, série, profil,
  réglages.
- **Aucune dépendance de navigation lourde** : l'app est volontairement
  simple (Accueil ↔ Partie + modales), un switch d'écran en state React
  suffit et reste trivial à auditer.
- **Pas d'assets graphiques propriétaires** : les zombies/avatars utilisent
  des emojis et des formes vectorielles simples, pour ne pas reproduire les
  illustrations protégées du jeu original tout en gardant une identité
  visuelle propre (fond nuit violette, accents vert toxique/jaune lune,
  cartes arrondies).

## 3. Structure du projet

```
src/
  engine/            Moteur du puzzle (pur TypeScript, sans dépendance UI)
    types.ts          Types Puzzle / CellState / Conflict
    generator.ts       Génération de puzzles à solution unique
    solver.ts           Comptage/recherche de solutions, détection de conflits
  state/
    store.ts           Store Zustand (progression, profil, réglages) + persistance
  theme/
    colors.ts           Palette de couleurs (fond, encre, accent, régions)
  utils/
    levelConfig.ts       Taille de grille par niveau, calcul du score
    sounds.ts             Lecture des bruitages (expo-audio)
  components/         Composants UI réutilisables (Cell, Board, TopBar, RuleCard,
                        ProgressBadges, PowerButton, WinModal, LoseModal,
                        ProfileModal, StreakModal, SettingsModal, Celebration,
                        PressableScale)
  screens/
    HomeScreen.tsx
    GameScreen.tsx
App.tsx              Point d'entrée, bascule Accueil ↔ Partie
assets/sounds/       Bruitages .wav CC0 (voir CREDITS.md)
scripts/
  generate-sounds.mjs  Synthétise les 4 bruitages en PCM, aucun asset tiers
```

### Génération de puzzle (`src/engine/generator.ts`)

1. **Solution** : backtracking aléatoire qui place une permutation de
   colonnes (une par ligne) telle que deux zombies sur des lignes
   consécutives ne soient jamais à une colonne de distance ≤ 1 (seules les
   lignes consécutives peuvent se toucher, donc c'est la seule contrainte à
   vérifier).
2. **Régions** : croissance aléatoire multi-sources (type diagramme de
   Voronoï) à partir de chaque cellule solution, avec un léger biais vers
   les régions les plus petites pour éviter des formes trop déséquilibrées.
3. **Unicité, garantie quand c'est possible dans le budget de temps** : le
   solveur (recherche avec heuristique MRV — la ligne la plus contrainte
   d'abord — pour rester praticable jusqu'à 16×16) cherche une solution
   alternative. Si elle existe, comme chaque solution valide utilise
   chaque région *exactement une fois*, voler à cette solution alternative
   une de ses cellules (en la réattribuant à une région voisine, tout en
   vérifiant que les deux régions restent connexes) invalide *cette*
   solution alternative sans jamais toucher la vraie solution. Cette
   réparation est répétée jusqu'à ce que le solveur ne trouve plus qu'une
   seule solution.
4. **Budget de temps borné par taille** (`budgetForSize` dans
   `generator.ts`) : sur les petites/moyennes grilles (jusqu'à 9×9),
   l'unicité est prouvée en quelques dizaines de millisecondes. Au-delà,
   l'espace des solutions alternatives grandit trop vite pour être
   entièrement exploré à chaque génération ; la génération part alors sur
   le meilleur agencement de régions trouvé avant l'expiration du budget,
   qui reste **toujours entièrement jouable** (la vraie solution ne
   bouge jamais) mais n'est pas garanti être *la seule* — au pire, un
   niveau très large peut exceptionnellement accepter plus d'une
   disposition valable, sans que cela casse la partie. Ce compromis garde
   la génération rapide et bornée dans le temps (jamais de blocage de
   l'interface) jusqu'à des grilles **16×16**.

## 4. Lancer le projet

```bash
npm install

npm run web       # Web (navigateur)
npm run ios       # iOS (simulateur/appareil via Expo Go ou build dev)
npm run android   # Android (émulateur/appareil via Expo Go ou build dev)
```

Pour construire des binaires natifs distribuables (App Store / Play
Store), utiliser [EAS Build](https://docs.expo.dev/build/introduction/) :

```bash
npx eas-cli build --platform ios
npx eas-cli build --platform android
```

## 5. Limites connues / pistes d'évolution

- Pas de backend : la progression, la série et le défi quotidien sont
  locaux à l'appareil (`AsyncStorage`) — pas de classement partagé ni de
  compte joueur multi-appareil.
- Pas de vraies illustrations d'avatars (emojis à la place), pour rester
  dans un scope raisonnable et éviter de reproduire des assets protégés.
- L'indice 💡 (voir §1) ne chaîne qu'un seul niveau de déduction logique
  (pas de solveur complet) ; sur un board state où rien n'est déductible
  dans l'immédiat, il retombe encore sur l'ancien comportement (révéler
  une cellule de la solution) plutôt que de ne rien faire.
- Sur les très grandes grilles (environ 11×11 et au-delà), la génération
  n'est plus garantie *strictement* unique (voir §3) — c'est un compromis
  assumé pour rester rapide jusqu'à 16×16 plutôt qu'un bug ; le niveau
  reste toujours entièrement valide et jouable.
- Les publicités récompensées (§1) tournent sur le vrai SDK AdMob sur
  iOS/Android, mais avec les identifiants de **test** de Google — voir
  `src/config/adIds.js` pour passer aux vrais identifiants une fois créés.
  Jamais testé sur un vrai appareil (aucun build natif n'a encore été
  fait), et la conformité GDPR/UMP pour l'UE reste à faire (voir
  `utils/ads.ts`).
- Préparation à la soumission sur les stores : `app.config.ts` (remplace
  l'ancien `app.json` statique, pour partager les identifiants AdMob avec
  `src/config/adIds.js`) a ses identifiants natifs
  (`bundleIdentifier`/`package` `com.darchevert.zombidoku`) et les plugins
  App Tracking Transparency + AdMob ; `eas.json` a des profils de build de
  base ; `public/privacy.html` est une politique de confidentialité prête
  à héberger (à compléter avant publication) ; `docs/store-submission.md`
  regroupe le texte de fiche
  store et les réponses aux formulaires "Sécurité des données"/"App
  Privacy" des deux consoles.
