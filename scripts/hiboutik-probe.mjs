// Test Hiboutik : affiche la réponse brute d'un produit pour trouver les photos.
// Usage : node --env-file=.env.local scripts/hiboutik-probe.mjs <product_id>
const { HIBOUTIK_ACCOUNT, HIBOUTIK_USER, HIBOUTIK_API_KEY } = process.env;
if (!HIBOUTIK_ACCOUNT || !HIBOUTIK_USER || !HIBOUTIK_API_KEY) {
  console.error("Clés Hiboutik absentes de .env.local");
  process.exit(1);
}
const id = process.argv[2];
const base = `https://${HIBOUTIK_ACCOUNT}.hiboutik.com/api`;
const auth =
  "Basic " +
  Buffer.from(`${HIBOUTIK_USER}:${HIBOUTIK_API_KEY}`).toString("base64");

const get = async (path) => {
  const res = await fetch(base + path, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  const text = await res.text();
  console.log(`\n=== GET ${path} → ${res.status}`);
  console.log(text.slice(0, 4000));
};

if (id) {
  await get(`/products/${id}`);
} else {
  await get(`/products/?p=1`);
}
