"use strict";

// ═════════════════════════════════════════════════════════════════════════════
//  routes/produits.js — Routes publiques des produits
// ═════════════════════════════════════════════════════════════════════════════

const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/produits — tous les produits actifs avec stock disponible
router.get("/", (req, res) => {
  const { categorie } = req.query;
  let sql = "SELECT * FROM produits WHERE actif = 1 AND stock > 0";
  const params = [];

  if (categorie) {
    sql += " AND categorie = ?";
    params.push(categorie);
  }

  sql += " ORDER BY id DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/produits/:id — détail d'un produit
router.get("/:id", (req, res) => {
  const produit = db
    .prepare("SELECT * FROM produits WHERE id = ? AND actif = 1")
    .get(req.params.id);

  if (!produit) return res.status(404).json({ error: "Produit introuvable" });
  res.json(produit);
});

module.exports = router;
