"use strict";

// ═════════════════════════════════════════════════════════════════════════════
//  routes/admin.js — Routes protégées back-office
// ═════════════════════════════════════════════════════════════════════════════

const { Router } = require("express");
const db = require("../db");

const router = Router();

// ── Middleware : vérifie le Bearer token ─────────────────────────────────────
function requireAdmin(req, res, next) {
  const { ADMIN_SECRET } = req.app.locals;
  const auth = req.headers["authorization"];
  if (!auth || auth !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  next();
}

// Applique requireAdmin à toutes les routes de ce router
router.use(requireAdmin);

// ── Produits ─────────────────────────────────────────────────────────────────

// GET /api/admin/produits — tous les produits (y compris inactifs)
router.get("/produits", (req, res) => {
  const rows = db.prepare("SELECT * FROM produits ORDER BY id DESC").all();
  res.json(rows);
});

// POST /api/admin/produits — ajouter un produit
router.post("/produits", (req, res) => {
  const {
    nom,
    description,
    materiaux,
    prix,
    stock,
    image_url,
    categorie,
    images_json,
  } = req.body;

  if (!nom || prix == null || stock == null) {
    return res
      .status(400)
      .json({ error: "Champs obligatoires : nom, prix, stock" });
  }

  const result = db
    .prepare(
      `
      INSERT INTO produits (nom, description, materiaux, prix, stock, image_url, categorie, images_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      nom,
      description,
      materiaux,
      prix,
      stock,
      image_url,
      categorie ?? "autre",
      images_json ?? null,
    );

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/admin/produits/:id — modifier un produit
router.put("/produits/:id", (req, res) => {
  const {
    nom,
    description,
    materiaux,
    prix,
    stock,
    image_url,
    categorie,
    actif,
    images_json,
  } = req.body;

  const produit = db
    .prepare("SELECT id FROM produits WHERE id = ?")
    .get(req.params.id);
  if (!produit) return res.status(404).json({ error: "Produit introuvable" });

  db.prepare(
    `
    UPDATE produits
    SET nom         = COALESCE(?, nom),
        description = COALESCE(?, description),
        materiaux   = COALESCE(?, materiaux),
        prix        = COALESCE(?, prix),
        stock       = COALESCE(?, stock),
        image_url   = COALESCE(?, image_url),
        categorie   = COALESCE(?, categorie),
        actif       = COALESCE(?, actif),
        images_json = COALESCE(?, images_json)
    WHERE id = ?
  `,
  ).run(
    nom,
    description,
    materiaux,
    prix,
    stock,
    image_url,
    categorie,
    actif,
    images_json ?? null,
    req.params.id,
  );

  res.json({ success: true });
});

// DELETE /api/admin/produits/:id — désactivation (soft delete)
router.delete("/produits/:id", (req, res) => {
  const produit = db
    .prepare("SELECT id FROM produits WHERE id = ?")
    .get(req.params.id);
  if (!produit) return res.status(404).json({ error: "Produit introuvable" });

  db.prepare("UPDATE produits SET actif = 0 WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ── Commandes ─────────────────────────────────────────────────────────────────

// GET /api/admin/commandes — les 100 dernières commandes payées
router.get("/commandes", (req, res) => {
  const rows = db
    .prepare(
      "SELECT * FROM commandes WHERE statut != 'en_attente' ORDER BY created_at DESC LIMIT 100",
    )
    .all();
  res.json(rows);
});

// PATCH /api/admin/commandes/:id/traiter — marquer comme traitée
router.patch("/commandes/:id/traiter", (req, res) => {
  const { statut } = req.body; // 'traitée' ou 'payé'
  const valide = ["traitée", "payé"];
  if (!valide.includes(statut))
    return res.status(400).json({ error: "Statut invalide" });
  db.prepare("UPDATE commandes SET statut = ? WHERE id = ?").run(
    statut,
    req.params.id,
  );
  res.json({ success: true });
});

// ── Messages de contact ───────────────────────────────────────────────────────

// GET /api/admin/messages — tous les messages
router.get("/messages", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM messages ORDER BY created_at DESC")
    .all();
  res.json(rows);
});

// PATCH /api/admin/messages/:id/lu — marquer comme lu
router.patch("/messages/:id/lu", (req, res) => {
  db.prepare("UPDATE messages SET lu = 1 WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
