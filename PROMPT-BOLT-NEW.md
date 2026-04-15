# Prompt bolt.new — Migration du projet "Week-ends Hélia & Noé"

## Objectif

Recréer un site web React (Vite + Tailwind CSS 4) à partir du code source et des données fournis ci-dessous. Le site est un **planificateur familial d'activités** pour deux enfants en garde alternée, centré sur Toulouse. Il comporte 5 pages et un système de données JSON statiques.

---

## Stack technique

| Élément | Choix |
|---------|-------|
| Framework | React 19 + TypeScript |
| Bundler | Vite |
| CSS | Tailwind CSS 4 (avec `@theme inline` en OKLCH) |
| Routing | wouter |
| Animations | framer-motion |
| Icônes | lucide-react |
| PDF | jspdf |
| Toasts | sonner |
| Thème | next-themes |
| Carte | Google Maps JavaScript API (ou Leaflet si pas de clé API) |
| UI | shadcn/ui (button, card, tooltip, sonner uniquement) |

### Dépendances npm à installer

```
react react-dom wouter framer-motion lucide-react jspdf sonner next-themes clsx tailwind-merge class-variance-authority @radix-ui/react-slot @radix-ui/react-tooltip
```

---

## Contexte famille

- **Père** : Sébastien, quartier Guilheméry, Toulouse (31500)
- **Mère** : Nathalie
- **Grands-parents paternels** : Rosy & Bernard
- **Enfants** : Hélia (8 ans) et Noé (6 ans)
- **Garde alternée** : semaines ISO impaires = Sébastien, semaines paires = Nathalie
- **Échange standard** : le vendredi (dépôt école le matin, récupération fin d'après-midi)
- **Coucher** : 20h
- **Intérêts des enfants** : espace/astronomie, nature/animaux, escalade/grimpe, vélo, arts plastiques, cuisine, histoires/contes

---

## Design : "Bento Box" — Grille modulaire japonaise

Le site utilise un design inspiré des boîtes à bento japonaises et des dashboards modulaires (Apple/Notion).

### Principes

1. Grille asymétrique de cartes aux proportions variées — chaque carte est un module autonome
2. Coins généreux (border-radius 16-24px sur les cartes, 5px sur les cellules du calendrier), ombres douces
3. Fond crème doux en mode clair, ardoise profond en mode sombre
4. Densité visuelle maîtrisée : chaque carte respire, espacement 12-16px entre les modules

### Palette de couleurs

- **Fond clair** : `#F8F6F2` (crème)
- **Fond sombre** : `#1A1A2E` (ardoise)
- **Texte principal** : `#1C1C1E` (charbon) en clair, `#F0F0F5` en sombre
- **Accents par type d'activité** :
  - Nature : `#2d9d5f`
  - Culture : `#7c3aed`
  - Spectacle : `#ea6c20`
  - Sport : `#0891b2`
  - Atelier : `#e11d48`
  - Événement : `#db2777`
  - Gastronomie : `#ca8a04`
- **Couleurs de garde** :
  - Sébastien : rouge/rose (`bg: #ffe4e6`, `text: #be123c`)
  - Nathalie : vert (`bg: #dcfce7`, `text: #15803d`)
  - Rosy & Bernard : jaune (`bg: #fef9c3`, `text: #a16207`)
  - Famille élargie : bleu (`bg: #dbeafe`, `text: #1d4ed8`)
  - Jour d'échange (partage) : dégradé diagonal entre les deux couleurs de garde

### Typographie

- **Titres** : Inter (600-700)
- **Corps** : DM Sans (400-500)
- Google Fonts : `Inter:wght@400;500;600;700` + `DM+Sans:wght@400;500`

### Animations

- Entrée en stagger des cartes (scale 0.95→1, opacity 0→1, 150ms par carte)
- Hover : légère élévation (shadow + translateY -2px)
- Transitions de filtre instantanées avec fade

---

## Architecture des pages (5 routes)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Planning | Calendrier annuel de garde 2026 (page d'accueil) |
| `/calendrier` | Calendrier | Vue calendrier mensuel avec activités |
| `/agenda` | Activités | Vue agenda jour par jour avec activités |
| `/liste` | Liste | Vue liste filtrable avec recherche |
| `/carte` | Carte | Vue carte interactive avec marqueurs |

### Navigation

Barre de navigation horizontale en haut : **Planning, Calendrier, Activités, Liste, Carte**. Logo "HN" + "Hélia & Noé Toulouse" à gauche. Bouton thème sombre/clair à droite. Sur mobile : menu hamburger.

---

## Page Planning (`/`) — Page d'accueil

Calendrier annuel 2026 avec :

- **12 mois en grille** (3 colonnes desktop, 1 colonne mobile)
- **Masquage des mois passés** par défaut, bouton "Année complète" pour tout afficher
- **Codage couleur des cellules** selon la garde (rouge=Sébastien, vert=Nathalie, jaune=Rosy & Bernard, bleu=Famille élargie)
- **Jours d'échange** : cellule avec dégradé diagonal entre les deux couleurs de garde (matin/soir)
- **Badges événements** : déplacements, voyages, stages, fériés
- **Hachures** sur les jours de vacances scolaires
- **Bordure rouge** sur les jours fériés
- **Légende filtrable** : clic sur un élément de la légende filtre les jours correspondants
- **Panneau de détail** : clic sur un jour affiche un panneau latéral avec toutes les informations
- **Frise chronologique** Mars-Décembre sous le calendrier
- **Export PDF** : bouton "Télécharger PDF" génère un A4 couleur, un mois par page
- **Clic sur un titre de mois** → navigation vers `/calendrier?month=X`
- **Date de mise à jour** affichée sous le sous-titre
- **Border-radius des cellules de date** : 5px

### Concept de "jour partagé" (partage)

Certains jours sont des jours d'échange de garde. Le modèle de données supporte un type `partage` avec `garde_matin` et `garde_soir` pour indiquer quel parent dépose le matin et lequel récupère le soir. Ces jours s'affichent avec un dégradé diagonal.

---

## Page Calendrier (`/calendrier`)

- Calendrier mensuel interactif avec navigation mois précédent/suivant
- Accepte un paramètre URL `?month=X` (0-indexed) pour pré-sélectionner un mois
- Fond des cellules coloré selon la garde
- Activités affichées comme pastilles colorées sur les jours
- Clic sur un jour → affiche les activités du jour

---

## Page Activités (`/agenda`)

- Vue agenda jour par jour (lundi à dimanche)
- Sélecteur de semaine (S17, S19, etc.)
- Chaque jour affiche : pastille de garde, badge vacances/férié, météo, activités en cartes Bento
- Carte spéciale "Jeu du mercredi" avec fond distinctif
- Les activités sont triées par priorité (incontournable > recommandé > optionnel)

---

## Page Liste (`/liste`)

- Toutes les activités de la semaine sélectionnée
- Sélecteur de semaine
- Filtres combinables en chips/pilules :
  - Par type (nature, culture, spectacle, sport, atelier, événement, gastronomie)
  - Par jour (lun-dim)
  - Par priorité (incontournable, recommandé, optionnel)
  - Par créneau (semaine-soir, samedi-matin, samedi-aprem, dimanche, mercredi)
  - Par tarif (gratuit/payant)
  - Par transport (vélo/voiture)
  - Par garde (Sébastien, Nathalie, Rosy & Bernard, Famille élargie)
- Barre de recherche texte
- Compteur de résultats
- Bouton réinitialiser
- Tri par date ou priorité

---

## Page Carte (`/carte`)

- Carte interactive plein écran (Google Maps ou Leaflet)
- Centre : Guilheméry (43.59833, 1.47278), zoom 12
- Marqueur "Maison" sur Guilheméry
- Marqueurs colorés par type d'activité
- Cercles concentriques de distance (5km, 10km, 30km)
- Sidebar rétractable avec filtres et liste d'activités cliquables
- Sélecteur de semaine
- Sur mobile : sidebar en tiroir bas

---

## Données JSON

Le site charge 3 types de fichiers JSON depuis `/data/` :

1. **`planning-2026.json`** : calendrier annuel de garde, vacances, déplacements, stages, voyages, fériés
2. **`2026-W17.json`** : activités de la semaine 17 (20-26 avril)
3. **`2026-W19.json`** : activités de la semaine 19 (4-10 mai)

Ces fichiers sont fournis dans le dossier `public/data/`. Le hook `useWeekData.ts` charge les fichiers d'activités, le hook `usePlanningData.ts` charge le planning et calcule la garde de chaque jour.

---

## Structure des fichiers source fournis

```
index.html                    → HTML d'entrée (Google Fonts Inter + DM Sans)
src/
  index.css                   → Design system Tailwind 4 (thème OKLCH, variables CSS)
  App.tsx                     → Routes wouter + ThemeProvider
  main.tsx                    → Point d'entrée React
  lib/
    types.ts                  → Types TypeScript + constantes (couleurs, labels)
    utils.ts                  → Utilitaires (cn, formatDate, etc.)
  hooks/
    usePlanningData.ts        → Hook de chargement du planning + calcul garde par jour
    useWeekData.ts            → Hook de chargement des activités par semaine
  contexts/
    ThemeContext.tsx           → Contexte thème sombre/clair
  components/
    Header.tsx                → Navigation principale
    ActivityCard.tsx           → Carte d'activité réutilisable
    Map.tsx                   → Composant Google Maps (à adapter si pas de clé API)
    ErrorBoundary.tsx         → Gestion d'erreurs React
    ui/                       → Composants shadcn/ui (button, card, sonner, tooltip)
  pages/
    Planning.tsx              → Page Planning (1004 lignes, la plus complexe)
    Calendrier.tsx            → Page Calendrier
    Home.tsx                  → Page Activités (anciennement Agenda)
    Liste.tsx                 → Page Liste
    Carte.tsx                 → Page Carte
    NotFound.tsx              → Page 404
public/
  data/
    planning-2026.json        → Données de garde annuelles
    2026-W17.json             → Activités semaine 17
    2026-W19.json             → Activités semaine 19
```

---

## Points d'attention pour la migration

1. **Carte** : le projet original utilise un proxy Google Maps spécifique à la plateforme Manus. Sur bolt.new, il faudra soit utiliser une clé API Google Maps, soit migrer vers Leaflet + OpenStreetMap (gratuit, pas de clé). Le composant `Map.tsx` devra être adapté en conséquence.

2. **Imports `@/`** : le projet utilise des alias de chemin (`@/components/...`, `@/lib/...`). Configurer le `tsconfig.json` et `vite.config.ts` avec :
   ```json
   "paths": { "@/*": ["./src/*"] }
   ```

3. **Tailwind CSS 4** : le fichier `index.css` utilise la syntaxe Tailwind v4 avec `@theme inline` et des variables OKLCH. Si bolt.new utilise Tailwind v3, il faudra adapter les variables CSS.

4. **jsPDF** : la fonction d'export PDF dans Planning.tsx dessine le calendrier manuellement via l'API Canvas de jsPDF. Pas de dépendance serveur.

5. **Données statiques** : les fichiers JSON dans `public/data/` sont chargés via `fetch()` côté client. Pas de backend nécessaire.

6. **Thème sombre** : géré via `next-themes` avec des classes CSS `.dark` et des variables CSS.

7. **Responsive** : le site est mobile-first. La navigation passe en hamburger sur mobile. Les filtres de garde sur la page Planning sont regroupés dans un menu déroulant sur mobile.

---

## Ton et style

- Pas d'émojis dans les descriptions d'activités
- Noms des parents affichés sans jugement : "Sébastien", "Nathalie", "Rosy & Bernard"
- Descriptions factuelles et pratiques
- Interface sobre, lisible, rapide
- Accentuation française correcte partout (Sébastien, Hélia, Noé, événement, etc.)
