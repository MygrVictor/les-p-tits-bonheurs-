"use strict";

// ═════════════════════════════════════════════════════════════════════════════
//  routes/contact.js — Formulaire de contact public
// ═════════════════════════════════════════════════════════════════════════════

const { Router } = require("express");
const db = require("../db");

const router = Router();

// POST /api/contact
router.post("/", (req, res) => {
  const { nom, email, sujet, message } = req.body;

  if (!nom || !email || !message) {
    return res
      .status(400)
      .json({ error: "Champs obligatoires : nom, email, message" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide" });
  }

  db.prepare(
    "INSERT INTO messages (nom, email, sujet, message) VALUES (?, ?, ?, ?)",
  ).run(nom.trim(), email.trim(), (sujet || "").trim(), message.trim());

  res.status(201).json({ success: true });
});

module.exports = router;
