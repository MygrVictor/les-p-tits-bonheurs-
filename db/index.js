"use strict";

// ═════════════════════════════════════════════════════════════════════════════
//  db/index.js — Initialisation SQLite + seed des données de démonstration
// ═════════════════════════════════════════════════════════════════════════════

const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(path.join(__dirname, "..", "boutique.db"));

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS produits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT    NOT NULL,
    description TEXT,
    materiaux   TEXT,
    prix        REAL    NOT NULL,
    stock       INTEGER NOT NULL DEFAULT 0,
    image_url   TEXT,
    categorie   TEXT,
    couleurs    TEXT,
    tailles     TEXT,
    actif       INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS commandes (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_session_id TEXT UNIQUE NOT NULL,
    items_json        TEXT NOT NULL,
    total             REAL NOT NULL,
    statut            TEXT NOT NULL DEFAULT 'en_attente',
    email_client      TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nom        TEXT NOT NULL,
    email      TEXT NOT NULL,
    sujet      TEXT,
    message    TEXT NOT NULL,
    lu         INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Migration colonnes optionnelles ────────────────────────────────────────
try {
  db.exec("ALTER TABLE commandes ADD COLUMN adresse_livraison TEXT");
} catch (_) {}
try {
  db.exec("ALTER TABLE produits ADD COLUMN couleurs TEXT");
} catch (_) {}
try {
  db.exec("ALTER TABLE produits ADD COLUMN tailles TEXT");
} catch (_) {}
try {
  db.exec("ALTER TABLE produits ADD COLUMN images_json TEXT");
} catch (_) {}

// ── Seed ────────────────────────────────────────────────────────────────────
const { n } = db.prepare("SELECT COUNT(*) AS n FROM produits").get();

if (n === 0) {
  const insert = db.prepare(`
    INSERT INTO produits (nom, description, materiaux, prix, stock, image_url, categorie, couleurs, tailles)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const produits = [
    // ── Perles ──────────────────────────────────────────────────────────────
    {
      nom: "Kit Perles Miyuki Délica",
      description:
        "Assortiment de perles Miyuki Délica japonaises de haute précision, idéal pour le tissage et le peyote. Couleurs soigneusement sélectionnées.",
      materiaux: "Perles de verre japonaises Miyuki 11/0, sachet 10 g",
      prix: 8.5,
      stock: 30,
      image_url:
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80",
      categorie: "perles",
      couleurs: JSON.stringify([
        "Rose poudré",
        "Bleu nuit",
        "Vert sauge",
        "Caramel",
        "Ivoire",
      ]),
      tailles: JSON.stringify(["11/0 (2 mm)", "8/0 (3 mm)"]),
    },
    {
      nom: "Perles Howlite Naturelle",
      description:
        "Perles rondes en howlite naturelle, pierre blanche veinée de gris, parfaite pour créer bracelets et colliers apaisants.",
      materiaux: "Pierre naturelle howlite, perçage 1 mm",
      prix: 12,
      stock: 20,
      image_url:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
      categorie: "perles",
      couleurs: JSON.stringify(["Blanc veiné"]),
      tailles: JSON.stringify(["6 mm", "8 mm", "10 mm"]),
    },
    // ── Maroquinerie Paul Marius ─────────────────────────────────────────────
    {
      nom: "Portefeuille Paul Marius — L'Étudiant",
      description:
        "Le portefeuille iconique Paul Marius. Cuir pleine fleur tanné végétal, fabriqué en France. Compact, élégant, durable.",
      materiaux: "Cuir pleine fleur, tannage végétal — Made in France",
      prix: 89,
      stock: 8,
      image_url:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
      categorie: "maroquinerie",
      couleurs: JSON.stringify([
        "Naturel",
        "Cognac",
        "Noir",
        "Bordeaux",
        "Vert anglais",
      ]),
      tailles: null,
    },
    {
      nom: "Tote Bag Paul Marius — Le Faubourg",
      description:
        "Grand sac cabas en cuir souple, spacieux et structuré. La signature Paul Marius dans un format quotidien.",
      materiaux: "Cuir gras patinable, anses tressées — Made in France",
      prix: 195,
      stock: 4,
      image_url:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
      categorie: "maroquinerie",
      couleurs: JSON.stringify(["Camel", "Noir", "Tabac", "Bleu marine"]),
      tailles: null,
    },
    // ── Bijoux créateurs ─────────────────────────────────────────────────────
    {
      nom: "Boucles Zag Bijoux — Arches",
      description:
        "Boucles d'oreilles créoles à l'architecture épurée, signature de la maison Zag. Légèreté et modernité.",
      materiaux: "Acier inoxydable doré 18 carats, hypoallergénique",
      prix: 55,
      stock: 10,
      image_url:
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
      categorie: "bijoux-createurs",
      couleurs: JSON.stringify(["Or", "Argent", "Or rose"]),
      tailles: null,
    },
    {
      nom: "Bracelet Bangle Up — Lila",
      description:
        "Jonc Bangle Up en résine marbrée à la main, chaque pièce est unique. Esprit Marrakech, style parisien.",
      materiaux: "Résine marbrée, finition brillante",
      prix: 48,
      stock: 12,
      image_url:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      categorie: "bijoux-createurs",
      couleurs: JSON.stringify([
        "Terracotta marbré",
        "Bleu orage",
        "Nude & or",
        "Vert émeraude",
      ]),
      tailles: JSON.stringify(["S/M", "M/L"]),
    },
    {
      nom: "Collier Canyon Bijoux — Mesa",
      description:
        "Pendentif inspiré des paysages de canyon, en argent massif travaillé à la main. Pièce statement.",
      materiaux: "Argent 925 massif, chaîne 50 cm",
      prix: 135,
      stock: 5,
      image_url:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
      categorie: "bijoux-createurs",
      couleurs: JSON.stringify(["Argent"]),
      tailles: JSON.stringify(["45 cm", "50 cm", "55 cm"]),
    },
    // ── Or & Argent massif ────────────────────────────────────────────────────
    {
      nom: "Alliance Or Jaune 18 carats",
      description:
        "Alliance lisse en or jaune 18 carats poli miroir. Classique intemporel, finition joaillerie.",
      materiaux: "Or jaune 18 carats (750/1000)",
      prix: 420,
      stock: 3,
      image_url:
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80",
      categorie: "or-argent",
      couleurs: JSON.stringify(["Or jaune", "Or blanc", "Or rose"]),
      tailles: JSON.stringify(["50", "52", "54", "56", "58", "60"]),
    },
    {
      nom: "Chevalière Argent Massif",
      description:
        "Chevalière en argent 925 massif, gravable sur demande. Port mixte, caractère affirmé.",
      materiaux: "Argent 925 massif, rhodiage optionnel",
      prix: 185,
      stock: 6,
      image_url:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      categorie: "or-argent",
      couleurs: JSON.stringify(["Argent poli", "Argent brossé"]),
      tailles: JSON.stringify(["54", "56", "58", "60", "62"]),
    },
    // ── Cadeaux ──────────────────────────────────────────────────────────────
    {
      nom: "Coffret Création Bijoux — Débutant",
      description:
        "Tout le nécessaire pour créer ses premiers bijoux : perles variées, fils, fermoirs et guide illustré. Idée cadeau parfaite.",
      materiaux: "Perles de verre, fils nylon, accessoires métal argenté",
      prix: 34,
      stock: 15,
      image_url:
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80",
      categorie: "cadeaux",
      couleurs: null,
      tailles: null,
    },
    {
      nom: "Bon Cadeau Les P'tits Bonheurs",
      description:
        "Offrez le choix ! Un bon cadeau à utiliser en boutique ou sur notre site, valable 1 an.",
      materiaux: "Carte cadeau illustrée + enveloppe kraft",
      prix: 50,
      stock: 99,
      image_url:
        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
      categorie: "cadeaux",
      couleurs: null,
      tailles: JSON.stringify(["20 €", "30 €", "50 €", "100 €"]),
    },
    // ── Cosmétique zéro déchet ────────────────────────────────────────────────
    {
      nom: "Shampoing Solide Nourrissant",
      description:
        "Shampoing solide naturel à l'huile de coco et à la kératine végétale. Zéro plastique, 100 % biodégradable. Équivalent 2 flacons.",
      materiaux: "Huile de coco bio, kératine végétale, cire de carnauba",
      prix: 14,
      stock: 25,
      image_url:
        "https://images.unsplash.com/photo-1584361853901-dd1904bb7987?w=600&q=80",
      categorie: "cosmetique",
      couleurs: null,
      tailles: JSON.stringify(["55 g", "85 g"]),
    },
    {
      nom: "Déodorant Solide Naturel",
      description:
        "Déodorant solide efficace 24 h, sans aluminium ni plastique. Parfum délicat de lavande et tea tree.",
      materiaux:
        "Bicarbonate de soude, beurre de karité bio, huiles essentielles",
      prix: 11,
      stock: 30,
      image_url:
        "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
      categorie: "cosmetique",
      couleurs: null,
      tailles: JSON.stringify(["45 g"]),
    },
  ];

  db.exec("BEGIN");
  try {
    for (const p of produits) {
      insert.run(
        p.nom,
        p.description,
        p.materiaux,
        p.prix,
        p.stock,
        p.image_url,
        p.categorie,
        p.couleurs ?? null,
        p.tailles ?? null,
      );
    }
    db.exec("COMMIT");
    console.log("✅  8 produits de démonstration insérés.");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

module.exports = db;
