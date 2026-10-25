# PANNELLO — TASTE THE BEST | Menu Numérique

Application web officielle du menu numérique **PANNELLO** (Khemis Miliana, Algérie), conçue mobile-first pour un accès instantané par scan de code QR en salle. Construite avec **Vite 8**, **React 19**, **TypeScript** et **Tailwind CSS v4**.

---

## Fonctionnalités Clés

- **Introduction Cinématique Plein Écran (3 secondes)** :
  - Scène plein écran rouge PANNELLO (`100dvh`) avec logo officiel blanc centré, ondes lumineuses 60 fps sur Canvas, bouton `Passer / Skip` accessible et respect natif de `prefers-reduced-motion`.
- **En-tête Permanent & Navigation Catégories Fixe** :
  - Bouton menu trois-points (`⋮`) à gauche (tiroir portalisé contenant accès aux commandes locales, sélecteur de langue FR/EN, accès direct aux 11 catégories, Instagram, Facebook & TikTok officiels, appel livraison et localisation Google Maps).
  - Logo PANNELLO centré avec transition instantanée entre le thème Clair (logo rouge) et le thème Sombre (logo blanc).
  - Accès rapide « Commandes » et bascule Mode Clair / Mode Sombre à droite : démarrage en Mode Clair à chaque chargement de page, avec bascule instantanée vers le Mode Sombre durant la session active.
- **Carte Authentique Complète (11 Catégories • 68 Produits)** :
  - `Smash Burger` (6), `Pocket` (3), `Fries` (2), `Drinks / Boissons` (12), `Sweets` (18), `Pizza Sauce Rouge` (9), `Pizza Sauce Blanche` (6), `Tacos` (5), `Sandwiches` (3), `Tombik` (3), `Calzon` (1).
  - Sélecteurs interactifs multi-tailles (`Mini | Normal | Mega` pour les pizzas, `M | L | XL` pour les tacos), choix du pain (`Brioche | Matlou3`), choix des 6 garnitures Calzon, suppléments et affichage transparent des prix en Dinars Algériens (`DA`).
- **Gestion Locale des Commandes (`localStorage`)** :
  - Sélection obligatoire du numéro de table (`Table 1` à `Table 20`), enregistrement local des commandes sur l'appareil (`Confirmer la commande`), consultation de l'historique via le panneau `Commandes` et suppression individuelle sécurisée avec confirmation.
- **Livraison par Téléphone & Réseaux Officiels** :
  - Section dédiée « Livraison disponible » avec appel direct (`0781 27 28 71` / `tel:+213781272871`) et liens officiels Instagram, Facebook et TikTok (`@pannelo8`).
- **Recherche Instantanée Bilingue (FR / EN)** :
  - Filtrage insensible aux accents sur les noms de plats, ingrédients, sous-catégories et catégories traduites.

---

## Prérequis & Commandes Locales

- **Node.js** : `>= 20.0.0` (compatible Node.js 20 LTS / 22 LTS)
- **Gestionnaire de paquets** : `npm` (via `package-lock.json`)

```bash
# 1. Installation propre et reproductible des dépendances
npm ci

# 2. Serveur de développement (http://localhost:3000)
npm run dev

# 3. Vérification TypeScript stricte
npm run typecheck

# 4. Build de production (génère dist/)
npm run build

# 5. Prévisualisation locale du build de production (http://localhost:4173)
npm run preview
```

---

## Déploiement sur Vercel

Le projet est configuré via `vercel.json` et `.vercelignore` pour un déploiement statique Vite zéro-serveur :

- **Framework Preset** : `Vite`
- **Root Directory** : `./`
- **Install Command** : `npm ci`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Node.js Version** : `20.x` ou `22.x`
- **Variables d'environnement** : **Aucune requise** (application 100 % statique côté client).

---

## Structure du Projet

```text
├── index.html                  # Point d'entrée HTML, SEO, OpenGraph, JSON-LD & préchargement
├── package.json                # Scripts npm et dépendances Vite + React 19 + Tailwind v4
├── package-lock.json           # Lockfile npm déterministe pour npm ci & Vercel
├── tsconfig.json               # Configuration TypeScript stricte
├── vercel.json                 # Configuration de build et d'en-têtes Vercel
├── .vercelignore               # Exclusions d'artefacts locaux lors d'un déploiement CLI
├── vite.config.ts              # Configuration Vite, alias @/* & découpage du bundle React
├── public/
│   ├── 404.html                # Page 404 statique personnalisée aux couleurs de PANNELLO
│   ├── assets/                 # Logos officiels PANNELLO (blanc, rouge, icônes) & photos extraites
│   └── images/
│       ├── categories/         # Photographies des 11 bannières de catégories
│       └── products/           # Photographies produits dédiées
├── src/
│   ├── main.tsx                # Montage React DOM
│   ├── App.tsx                 # Assemblage principal, recherche, commandes & pied de page
│   ├── index.css               # Thème Tailwind v4, grille géométrique & animations GPU
│   ├── components/
│   │   ├── AmbientBackground.tsx
│   │   ├── CategoryNavigation.tsx
│   │   ├── CinematicIntro.tsx
│   │   ├── DataAuditModal.tsx
│   │   ├── FooterContactSection.tsx
│   │   ├── Header.tsx
│   │   ├── Image.tsx
│   │   ├── MenuSection.tsx
│   │   ├── OrderSelectionDrawer.tsx
│   │   ├── OrdersModal.tsx
│   │   ├── ProductCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Skeletons.tsx
│   │   └── ThreeDotMenu.tsx
│   ├── hooks/
│   │   ├── use-language.ts
│   │   ├── use-orders.ts
│   │   └── use-theme.ts
│   └── lib/
│       ├── category-images.ts
│       ├── menu-data.ts
│       ├── order-storage.ts
│       ├── restaurant-contact.ts
│       └── translations.ts
└── MENU_DATA_REVIEW.md         # Document d'audit complet des données du menu
```
