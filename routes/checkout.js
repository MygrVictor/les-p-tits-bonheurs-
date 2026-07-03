"use strict";

// ═════════════════════════════════════════════════════════════════════════════
//  routes/checkout.js — Création de la Stripe Checkout Session
// ═════════════════════════════════════════════════════════════════════════════

const { Router } = require("express");
const db = require("../db");

const router = Router();

// POST /api/checkout
// Corps attendu : { items: [{ id: 1, quantite: 2 }, ...] }
router.post("/", async (req, res) => {
  const { stripe, SITE_URL } = req.app.locals;

  if (!stripe) {
    return res.status(503).json({
      error: "Stripe non configuré — renseignez STRIPE_SECRET_KEY dans .env",
    });
  }

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Panier vide ou invalide" });
    }

    const lineItems = [];
    const commandeItems = [];

    for (const item of items) {
      const produit = db
        .prepare(
          "SELECT * FROM produits WHERE id = ? AND actif = 1 AND stock >= ?",
        )
        .get(item.id, item.quantite ?? 1);

      if (!produit) {
        return res.status(400).json({
          error: `Produit ${item.id} indisponible ou stock insuffisant`,
        });
      }

      const qty = parseInt(item.quantite) || 1;

      lineItems.push({
        price_data: {
          currency: "eur",
          unit_amount: Math.round(produit.prix * 100),
          product_data: {
            name: produit.nom,
            description: produit.materiaux,
            images: produit.image_url ? [produit.image_url] : [],
          },
        },
        quantity: qty,
      });

      commandeItems.push({
        id: produit.id,
        nom: produit.nom,
        prix: produit.prix,
        quantite: qty,
      });
    }

    // Calcul du total côté serveur — ne jamais faire confiance au client
    const total = commandeItems.reduce(
      (sum, i) => sum + i.prix * i.quantite,
      0,
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      metadata: {
        items_json: JSON.stringify(commandeItems),
        total: String(total),
      },
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU"],
      },
      success_url: `${SITE_URL}?paiement=succes&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}?paiement=annule`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌  Erreur /api/checkout :", err.message);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

module.exports = router;
