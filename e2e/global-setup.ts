import { chromium } from "@playwright/test";

/**
 * Préchauffe le serveur Next.js dev en visitant les pages critiques
 * avant le démarrage des tests, pour éviter les timeouts de compilation.
 */
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const pages = ["/", "/nouveautes", "/panier", "/checkout", "/compte"];

  for (const path of pages) {
    try {
      await page.goto(`http://localhost:3000${path}`, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
    } catch {
      // Ignorer les erreurs — on préchauffe juste le compilateur
    }
  }

  await browser.close();
}
