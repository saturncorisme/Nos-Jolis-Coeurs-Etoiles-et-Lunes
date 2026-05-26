# 🌙 Les Jolis Cœurs, Étoiles & Lunes du Monde

> *Une bibliothèque poétique de formes cachées dans les rues du monde.*

Archivez les cœurs, étoiles et lunes trouvés dans la rue — tags, stickers, ombres, architectures. Chaque forme a une histoire. Partagez votre collection via un lien unique, sans réseau social.

---

## ✨ Fonctionnalités

- **Auth** : Inscription / connexion par email + mot de passe (Supabase Auth)
- **Profil public** : `/u/[pseudo]` — nom, bio, avatar, grille d'archives
- **Archives** : photo, titre, récit, coordonnées GPS, date automatique
- **Carte** : Leaflet + OpenStreetMap sur chaque archive géolocalisée
- **Thèmes** : Papier crémeux ☽ / Ciel pastel ☆ / Fleur pastel ♡
- **Typographies** : 4 combinaisons de polices pour personnaliser son profil public
- **Partage** : lien public stable, sans compte requis pour consulter

---

## 🗄️ Configuration Supabase

### 1. Créer le projet

1. Allez sur [supabase.com](https://supabase.com) et créez un nouveau projet
2. Notez l'**URL** et la **clé anon** (dans Project Settings > API)

### 2. Créer les tables

Dans l'éditeur SQL de Supabase, exécutez :

```sql
-- Table profils
CREATE TABLE profiles (
  id             uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username       text UNIQUE NOT NULL,
  display_name   text,
  bio            text DEFAULT '',
  avatar_url     text,
  theme_preference text DEFAULT 'cream',
  font_preference  text DEFAULT 'classic',
  created_at     timestamptz DEFAULT now()
);

-- Table archives
CREATE TABLE archives (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  story      text NOT NULL,
  latitude   float8,
  longitude  float8,
  photo_url  text,
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX archives_user_id_idx ON archives(user_id);
CREATE INDEX profiles_username_idx ON profiles(username);
```

### 3. Row Level Security (RLS)

```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (true);

-- Profiles : modification par le propriétaire
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles : insertion par l'utilisateur lui-même (à la création de compte)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Archives : lecture publique
CREATE POLICY "archives_select_public"
  ON archives FOR SELECT USING (true);

-- Archives : insertion par le propriétaire
CREATE POLICY "archives_insert_own"
  ON archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Archives : modification par le propriétaire
CREATE POLICY "archives_update_own"
  ON archives FOR UPDATE
  USING (auth.uid() = user_id);

-- Archives : suppression par le propriétaire
CREATE POLICY "archives_delete_own"
  ON archives FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Storage — Buckets

Dans Supabase > Storage, créez deux buckets publics :

| Bucket     | Public | Taille max | Types autorisés         |
|------------|--------|------------|--------------------------|
| `archives` | ✅ oui | 5 Mo       | image/jpeg, image/png, image/webp |
| `avatars`  | ✅ oui | 2 Mo       | image/jpeg, image/png, image/webp |

**Politiques Storage** (dans Storage > Policies) :

```sql
-- avatars : lecture publique
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- avatars : upload par le propriétaire
CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars : upsert par le propriétaire
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- archives : lecture publique
CREATE POLICY "archives_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'archives');

-- archives : upload par le propriétaire
CREATE POLICY "archives_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'archives' AND auth.uid()::text = (storage.foldername(name))[1]);

-- archives : suppression par le propriétaire
CREATE POLICY "archives_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'archives' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## ⚙️ Variables d'environnement

Copiez `.env.example` en `.env` et remplissez :

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Lancement local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173)

---

## 📦 Déploiement

### Netlify (recommandé)

1. Poussez le code sur GitHub
2. Sur Netlify : New site > Import from GitHub
3. Build command : `npm run build`
4. Publish directory : `dist`
5. Ajoutez les variables d'environnement dans Site settings > Environment variables
6. Ajoutez un fichier `netlify.toml` :

```toml
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```

### Vercel

```bash
npm i -g vercel
vercel --prod
```

Ajoutez les variables d'environnement via le dashboard Vercel.

### GitHub Pages

```bash
npm run build
# Pousser le dossier dist/ sur la branche gh-pages
```

Dans `vite.config.js`, décommentez et adaptez `base: '/nom-du-repo/'`.

---

## 📁 Structure des fichiers

```
jolis-coeurs/
├── index.html                    # Point d'entrée SPA
├── src/
│   ├── main.js                   # Routeur + état global
│   ├── styles/
│   │   ├── base.css              # Variables, reset, composants
│   │   └── fonts-tumblr.css      # Combinaisons typo par profil
│   ├── components/
│   │   ├── Header.js             # Navigation + switcher thème
│   │   ├── Footer.js             # Pied de page
│   │   ├── ArchiveCard.js        # Carte archive (grille)
│   │   └── MapView.js            # Carte Leaflet
│   ├── lib/
│   │   └── supabase.js           # Client + helpers Supabase
│   └── pages/
│       ├── HomePage.js           # Accueil
│       ├── LoginPage.js          # Connexion + mot de passe oublié
│       ├── SignupPage.js         # Inscription
│       ├── ProfilePage.js        # Profil public /u/[pseudo]
│       ├── UserArchivesPage.js   # Archives publiques + Mes archives
│       ├── ArchiveDetailPage.js  # Détail archive /a/[id]
│       ├── NewArchivePage.js     # Formulaire nouvelle archive
│       └── SettingsPage.js       # Réglages profil + thème + typo
├── public/
│   └── logo.svg                  # Logo SVG ♡ ☆ ☽
├── .env.example
├── vite.config.js
├── package.json
└── README.md
```

---

## 🎨 Personnalisation typographique (style Tumblr)

Chaque utilisateur peut choisir une combinaison de polices pour **son profil public** :

| Clé       | Titres               | Corps          | Citations      |
|-----------|----------------------|----------------|----------------|
| `classic` | Playfair Display     | Lora           | IBM Plex Mono  |
| `soft`    | Cormorant Garamond   | Nunito         | Caveat         |
| `modern`  | DM Mono              | Nunito         | JetBrains Mono |
| `travel`  | DM Serif Display     | Source Serif 4 | Courier Prime  |

La classe CSS `font-theme-[valeur]` est appliquée sur le conteneur de la page publique.

---

## 🔒 Sécurité

- **RLS Supabase** bloque toute modification non autorisée côté serveur
- La clé `anon` est publique mais sans RLS elle ne peut rien modifier
- Toutes les sorties HTML sont échappées (anti-XSS)
- Uploads limités à 5 Mo, types vérifiés côté client et Supabase

---

*Fait avec ♡ — pas de réseau social, juste des archives.*
