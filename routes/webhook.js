"use strict";

// ═════════════════════════════════════════════════════════════════════════════
//  routes/webhook.js — Réception et traitement des événements Stripe
// ═════════════════════════════════════════════════════════════════════════════

const { Router } = require("express");
const db = require("../db");

const router = Router();

// ⚠️  Ce middleware raw est positionné dans server.js AVANT express.json()
//     pour que le body arrive non parsé ici (requis pour vérifier la signature).

// POST /api/webhook
router.post("/", (req, res) => {
  const { stripe, STRIPE_WEBHOOK_SECRET } = req.app.locals;

  if (!stripe) return res.status(503).json({ error: "Stripe non configuré" });

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err) {
    console.error("⚠️   Signature Stripe invalide :", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    _handlePaiementConfirme(event.data.object);
  }

  // Stripe attend un 200 rapide
  res.json({ received: true });
});

// ── Traitement métier après paiement confirmé ────────────────────────────────
function _handlePaiementConfirme(session) {
  db.exec("BEGIN");
  try {
    const ship = session.shipping_details;
    const adresse = ship
      ? JSON.stringify({
          nom: ship.name ?? null,
          ligne1: ship.address?.line1 ?? null,
          ligne2: ship.address?.line2 ?? null,
          ville: ship.address?.city ?? null,
          cp: ship.address?.postal_code ?? null,
          pays: ship.address?.country ?? null,
        })
      : null;

    // Récupérer les articles depuis les metadata Stripe
    const itemsJson = session.metadata?.items_json ?? "[]";
    const total = parseFloat(
      session.metadata?.total ?? session.amount_total / 100,
    );

    // Insérer la commande (seulement maintenant, paiement confirmé)
    const cmd = db
      .prepare(
        `
      INSERT OR IGNORE INTO commandes
        (stripe_session_id, items_json, total, statut, email_client, adresse_livraison)
      VALUES (?, ?, ?, 'payé', ?, ?)
    `,
      )
      .run(
        session.id,
        itemsJson,
        total,
        session.customer_details?.email ?? null,
        adresse,
      );

    if (!cmd.changes) {
      // Doublon webhook — déjà traité
      db.exec("ROLLBACK");
      return;
    }

    // Décrémenter le stock de chaque article
    const items = JSON.parse(itemsJson);
    for (const item of items) {
      db.prepare(
        `UPDATE produits SET stock = MAX(0, stock - ?) WHERE id = ?`,
      ).run(item.quantite, item.id);
      db.prepare(
        `UPDATE produits SET actif = 0 WHERE id = ? AND stock = 0`,
      ).run(item.id);
    }

    db.exec("COMMIT");
    console.log(
      `✅  Commande payée (session ${session.id}) — stocks mis à jour.`,
    );
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

module.exports = router;
