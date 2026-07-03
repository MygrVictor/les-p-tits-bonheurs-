"use strict";

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const Stripe  = require("stripe");

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  ADMIN_SECRET,
  SITE_URL = "http://localhost:3000",
  PORT     = 3000,
} = process.env;

if (!ADMIN_SECRET) {
  console.error("Variable manquante dans .env : ADMIN_SECRET");
  process.exit(1);
}

const stripeReady = STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.includes("REMPLACER");
const stripe      = stripeReady ? Stripe(STRIPE_SECRET_KEY) : null;

if (!stripeReady) {
  console.warn("Stripe non configure — renseignez STRIPE_SECRET_KEY dans .env.");
}

// Initialisation BDD + seed
require("./db");

const app = express();

// Variables globales accessibles dans toutes les routes
app.locals.stripe                = stripe;
app.locals.SITE_URL              = SITE_URL;
app.locals.ADMIN_SECRET          = ADMIN_SECRET;
app.locals.STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET;

app.use(cors());

// Le webhook Stripe a besoin du body RAW — avant express.json()
app.use("/api/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Montage des routes
app.use("/api/produits", require("./routes/produits"));
app.use("/api/checkout", require("./routes/checkout"));
app.use("/api/webhook",  require("./routes/webhook"));
app.use("/api/admin",    require("./routes/admin"));
app.use("/api/contact",  require("./routes/contact"));

app.listen(PORT, () => {
  console.log(`Les P'tits Bonheurs — http://localhost:${PORT}`);
});
