# Les P'tits Bonheurs ✦

> Boutique e-commerce artisanale — bijoux & accessoires faits main  
> Stack : Node.js · Express · SQLite · Stripe Checkout

---

## Prérequis

- **Node.js ≥ 18** ([nodejs.org](https://nodejs.org))
- **Stripe CLI** pour tester les webhooks en local ([stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli))
- Un compte Stripe (gratuit, mode test disponible)

---

## Installation rapide

```bash
# 1. Cloner / ouvrir le projet
cd "les p'tits bonheurs"

# 2. Installer les dépendances
npm install

# 3. Copier et remplir le fichier d'environnement
cp .env.example .env
# → Edite .env avec tes vraies clés Stripe (voir section ci-dessous)

# 4. Lancer le serveur
node server.js
```

Le serveur démarre sur **http://localhost:3000**  
La base de données `boutique.db` est créée automatiquement avec 8 produits de démo.

---

## Structure du projet

```
/
├── server.js          ← API Express + intégration Stripe
├── public/
│   ├── index.html     ← Boutique (hero, grille, panier)
│   ├── admin.html     ← Back-office protégé par mot de passe
│   └── style.css      ← Design complet (CSS custom, pas de framework)
├── boutique.db        ← Créé automatiquement au démarrage
├── .env               ← Variables secrètes (NE PAS committer)
├── .env.example       ← Template des variables
└── package.json
```

---


## Configuration Stripe

### 1. Récupérer les clés API

1. Connecte-toi sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Passe en **mode test** (interrupteur en haut à gauche)
3. Va dans **Développeurs → Clés API**
4. Copie la **Clé secrète** (`sk_test_…`)
5. Colle-la dans `.env` → `STRIPE_SECRET_KEY=sk_test_…`

### 2. Configurer le webhook en local (développement)

Le webhook permet à Stripe de notifier ton serveur après un paiement réussi.  
En local, utilise la **Stripe CLI** pour rediriger les événements vers ton serveur :

```bash
# Installer la Stripe CLI (macOS via Homebrew)
brew install stripe/stripe-cli/stripe

# Se connecter à ton compte Stripe
stripe login

# Démarrer l'écoute et forwarder vers ton serveur
stripe listen --forward-to localhost:3000/api/webhook
```

La commande affiche une clé de la forme `whsec_…` — copie-la dans `.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

> ⚠️ Redémarre `node server.js` après avoir modifié `.env`.

### 3. Tester un paiement

1. Lance le serveur : `node server.js`
2. Lance `stripe listen` dans un second terminal
3. Ouvre http://localhost:3000
4. Ajoute des produits au panier → **Passer commande**
5. Sur la page Stripe, utilise la carte de test : **4242 4242 4242 4242** (date future, CVC quelconque)
6. Après paiement, tu es redirigé sur la boutique avec un message de confirmation
7. Dans le terminal `stripe listen`, tu verras l'événement `checkout.session.completed`
8. Le stock est décrémenté automatiquement dans `boutique.db`

---

## Variables d'environnement (`.env`)

| Variable                | Description                                          | Exemple                 |
| ----------------------- | ---------------------------------------------------- | ----------------------- |
| `STRIPE_SECRET_KEY`     | Clé secrète Stripe (mode test ou prod)               | `sk_test_…`             |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook (obtenu via `stripe listen`)       | `whsec_…`               |
| `PORT`                  | Port du serveur (défaut : 3000)                      | `3000`                  |
| `SITE_URL`              | URL publique du site (pour redirections Stripe)      | `http://localhost:3000` |
| `ADMIN_SECRET`          | Mot de passe admin (header Bearer + page admin.html) | `monMotDePasse123!`     |

---

## API — Endpoints

### Publics

| Méthode | Route               | Description                           |
| ------- | ------------------- | ------------------------------------- |
| GET     | `/api/produits`     | Liste des produits actifs (stock > 0) |
| GET     | `/api/produits/:id` | Détail d'un produit                   |
| POST    | `/api/checkout`     | Crée une session Stripe, retourne URL |
| POST    | `/api/webhook`      | Webhook Stripe (signature vérifiée)   |

### Admin (header `Authorization: Bearer <ADMIN_SECRET>` requis)

| Méthode | Route                     | Description                            |
| ------- | ------------------------- | -------------------------------------- |
| GET     | `/api/admin/produits`     | Tous les produits (y compris inactifs) |
| POST    | `/api/admin/produits`     | Ajouter un produit                     |
| PUT     | `/api/admin/produits/:id` | Modifier un produit                    |
| DELETE  | `/api/admin/produits/:id` | Désactiver un produit (soft delete)    |
| GET     | `/api/admin/commandes`    | Liste des 100 dernières commandes      |

---

## Back-office Admin

Accès : **http://localhost:3000/admin.html**

- Saisis la valeur de `ADMIN_SECRET` comme mot de passe
- Tu peux voir tous les produits (actifs et inactifs), leurs stocks en temps réel
- Ajouter un produit, modifier prix/stock/description, désactiver/réactiver
- Consulter toutes les commandes avec leur statut (`en_attente`, `payé`, `annulé`)

---

## Mise en production

1. Remplace les clés Stripe test par les clés **live** (`sk_live_…`)
2. Déploie sur un hébergeur Node.js (Railway, Render, Fly.io, VPS…)
3. Configure `SITE_URL` avec ton domaine réel
4. Crée le webhook dans le dashboard Stripe :
   - **Développeurs → Webhooks → Ajouter un endpoint**
   - URL : `https://ton-domaine.com/api/webhook`
   - Événement à écouter : `checkout.session.completed`
   - Copie la **Clé de signature** dans ta variable `STRIPE_WEBHOOK_SECRET`
5. Change `ADMIN_SECRET` pour un mot de passe fort et unique

---

## Développement avec rechargement automatique

```bash
# Node.js ≥ 18 : watch natif (pas besoin de nodemon)
npm run dev
```

---

_Les P'tits Bonheurs — Fait avec soin ✦_
