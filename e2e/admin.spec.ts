import { test, expect } from "@playwright/test";

/**
 * Tunnel admin : Accès protégé
 *
 * Sans compte admin réel dans la DB de test, ces tests vérifient
 * que les protections sont en place (redirect, accès refusé).
 * En intégration continue avec une vraie DB, on pourrait injecter
 * un compte admin via beforeAll + API seed.
 */
test.describe("Admin : protection et accès", () => {
  test("accès direct à /admin redirige vers /compte", async ({ page }) => {
    await page.goto("/admin");

    // Doit être redirigé vers la page de connexion
    await expect(page).toHaveURL(/compte/, { timeout: 10_000 });
  });

  test("accès direct à /admin/produits redirige aussi vers /compte", async ({
    page,
  }) => {
    await page.goto("/admin/produits");
    await expect(page).toHaveURL(/compte/, { timeout: 10_000 });
  });

  test("accès direct à /admin/commandes redirige aussi vers /compte", async ({
    page,
  }) => {
    await page.goto("/admin/commandes");
    await expect(page).toHaveURL(/compte/, { timeout: 10_000 });
  });
});
