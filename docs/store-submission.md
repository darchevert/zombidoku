# Préparation soumission stores — Zombidoku

Ce document rassemble tout le texte et les réponses prêts à copier-coller
dans Google Play Console et App Store Connect. Ce que je ne peux pas
deviner à ta place est marqué **[À COMPLÉTER]**.

## 1. Avant de commencer

- [x] `public/privacy.html` rempli (éditeur, contact, date, 13+). URL à donner aux stores une fois la branche déployée sur GitHub Pages : `https://darchevert.github.io/zombidoku/privacy.html`
- [x] Apps AdMob Android et iOS + un bloc Récompensé chacun créés ; IDs dans `src/config/adIds.js`
- [x] Consentement RGPD (UMP) intégré dans `src/utils/ads.ts`
- [ ] Vérifier dans AdMob (Confidentialité et messages) que le message européen couvre Zombidoku
- [ ] Avant la soumission : passer `USE_TEST_ADS` à `false` dans `src/config/adIds.js`

## 2. Fiche store (à copier tel quel, ajuster si besoin)

**Nom de l'app**
```
Zombidoku
```

**Sous-titre / accroche courte** (App Store, 30 caractères max)
```
Puzzle logique zombie
```

**Description courte** (Google Play, 80 caractères max)
```
Un puzzle logique zombie inspiré du Sudoku, sans aucun chiffre à calculer !
```

**Description longue**
```
Zombidoku est un puzzle de logique pure, sans chiffres : place un zombie
par ligne, par colonne et par cimetière, sans qu'aucun ne touche un autre
(même en diagonale). Simple à comprendre, difficile à maîtriser.

• Grilles de 6×6 à 16×16, une difficulté qui grandit avec ton niveau
• Alerte zombie quotidienne : la même grille pour tous les joueurs chaque
  jour
• Série de nuits survécues avec calendrier de bonus
• Un compagnon zombie à nourrir et personnaliser
• Mode Zen (sans limite de vies) et mode chrono pour les speedrunners
• Indices intelligents qui t'aident à raisonner, jamais à tricher

Aucune inscription, aucune donnée personnelle demandée. Ta progression
reste sur ton appareil.
```

**Mots-clés** (App Store, 100 caractères, séparés par des virgules, sans
espace après la virgule pour en garder le plus possible)
```
puzzle,logique,zombie,sudoku,reflexion,cerveau,cimetiere,queens,starbattle,casse-tete
```

**Catégorie**
- Google Play : Jeux > Puzzle
- App Store : Jeux > Puzzle (secondaire : Stratégie)

**URL marketing / site web** (facultatif mais accepté par les deux stores)
```
https://darchevert.github.io/zombidoku/
```

**URL d'assistance (support)**
```
[À COMPLÉTER — une adresse e-mail ou une page de contact valide]
```

## 3. Classification d'âge

Le jeu ne contient ni violence représentée (les zombies sont des emojis
sur une grille, pas de combat ni de sang), ni contenu généré par les
utilisateurs, ni chat entre joueurs, ni achat intégré en argent réel — la
monnaie du jeu (les 🧠 "cerveaux") s'obtient uniquement en jouant. Il
contient des publicités.

Réponses attendues au questionnaire dans les deux consoles :
- Violence : aucune / dessin animé uniquement
- Contenu à caractère sexuel, langage grossier, jeux d'argent simulé,
  contenu effrayant : non
- Interactions entre utilisateurs (chat, contenu partagé) : non
- Achats intégrés en argent réel : non
- Publicités : oui

Résultat attendu : classification la plus basse disponible sur les deux
stores (PEGI 3 / ESRB Everyone / "Tous publics").
**[À CONFIRMER toi-même dans le questionnaire — c'est une
auto-certification légale, je ne peux pas la remplir à ta place.]**

## 4. Google Play Console — formulaire "Sécurité des données" (Data safety)

Raccourci utile : une fois ton compte AdMob **lié** à Play Console
(Play Console → Fiche de l'app → Sécurité des données → "Importer depuis
AdMob"), Google pré-remplit une partie de ce formulaire automatiquement à
partir des SDK détectés dans ton app. Vérifie ensuite que ça correspond à
ce qui suit :

| Question | Réponse |
|---|---|
| L'app collecte-t-elle ou partage-t-elle des données utilisateur ? | Oui |
| Type de donnée | Identifiants d'appareil ou autres (identifiant publicitaire) |
| Cette donnée est-elle partagée avec des tiers ? | Oui — avec Google (AdMob), à des fins publicitaires |
| Cette donnée est-elle chiffrée en transit ? | Oui |
| L'utilisateur peut-il demander la suppression de cette donnée ? | Oui (réinitialisation de l'identifiant publicitaire dans les réglages Android) |
| Cette collecte est-elle obligatoire pour utiliser l'app ? | Non (les pubs sont optionnelles, récompensées) |
| Finalité de la collecte | Publicité ou marketing |
| L'app collecte-t-elle des données financières, de localisation précise, de santé, de contacts ? | Non |

## 5. App Store Connect — "App Privacy" (étiquette de confidentialité)

| Question | Réponse |
|---|---|
| Data Used to Track You | Oui — Identifiants (identifiant publicitaire / IDFA) |
| Finalité | Publicité tierce (Third-Party Advertising) |
| Data Linked to You | Non (aucune donnée liée à une identité) |
| Data Not Linked to You | Identifiants (IDFA), à des fins publicitaires |
| Contacts, position, santé, contenu utilisateur | Non collecté |

App Store Connect te demandera aussi si tu utilises l'App Tracking
Transparency — réponds **Oui**, le prompt est déjà intégré dans l'app
(`expo-tracking-transparency`, voir `src/utils/tracking.ts`).

## 6. Captures d'écran

Tailles minimales exigées (au moins un jeu de captures par plateforme) :

- **App Store** : iPhone 6.7" (1290×2796) obligatoire ; iPad si
  `supportsTablet` reste activé (c'est le cas).
- **Google Play** : au moins 2 captures téléphone, n'importe quelle
  résolution ≥ 320px, ratio entre 16:9 et 9:16.

Je peux générer un premier jeu de captures à partir du build web (rendu
dans un navigateur à la taille d'un téléphone) pour te donner une base —
dis-le-moi et je m'en occupe. Elles ne remplaceront pas des captures
prises sur un vrai appareil/simulateur avant la soumission finale, mais
suffisent pour préparer la fiche en attendant.

## 7. Ce qui reste bloquant après ce document

- Le SDK publicitaire réel (`react-native-google-mobile-ads`) — dépend des
  App ID / Ad Unit ID AdMob que tu dois créer (§1).
- Un vrai build natif testé sur appareil (`eas build`), jamais fait à ce
  jour.
- La création effective des fiches dans les deux consoles — seul toi peux
  cliquer là-dedans.
