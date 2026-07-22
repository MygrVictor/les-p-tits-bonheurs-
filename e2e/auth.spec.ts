import { test, expect } from "@playwright/test";

/**
 * Parcours critique : Inscription → Connexion
 *
 * Ce test vérifie que :
 * 1. La page /compte est accessible
 * 2. Les onglets Connexion / Inscription existent
 * 3. Le formulaire d'inscription affiche les bons champs
 * 4. Une tentative de connexion avec mauvais identifiants affiche une erreur
 */
test.describe("Auth : Inscription & Connexion", () => {
  test("page /compte accessible avec onglets login et register", async ({
    page,
  }) => {
    await page.goto("/compte");

    // La page doit charger sans erreur
    await expect(page).toHaveURL(/compte/);

    // Les onglets ou liens doivent exister
    const loginTab = page
      .getByRole("tab", { name: /connexion|se connecter/i })
      .or(page.getByText(/connexion|se connecter/i).first());
    await expect(loginTab).toBeVisible({ timeout: 10_000 });

    const registerTab = page
      .getByRole("tab", { name: /inscription|créer/i })
      .or(page.getByText(/inscription|créer un compte/i).first());
    await expect(registerTab).toBeVisible({ timeout: 10_000 });
  });

  test("formulaire de connexion affiche erreur avec mauvais identifiants", async ({
    page,
  }) => {
    await page.goto("/compte");
    await page.waitForLoadState("networkidle");

    // Attendre que les champs soient interactifs
    const emailInput = page.locator("input[type='email']").first();
    const passwordInput = page.locator("input[type='password']").first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await expect(passwordInput).toBeVisible({ timeout: 5_000 });

    await emailInput.fill("test-inexistant@example.com");
    await passwordInput.fill("motdepasseinvalide123");

    const submitBtn = page
      .getByRole("button", { name: /connexion|se connecter/i })
      .first();
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // L'app peut soit afficher une erreur inline, soit rediriger vers /api/auth/error
    await expect
      .poll(
        async () => {
          const inlineErrorVisible = await page
            .getByText(
              /incorrect|invalide|erreur|Email ou mot de passe|email non confirmé/i,
            )
            .first()
            .isVisible()
            .catch(() => false);
          const isAuthErrorRoute = /\/api\/auth\/error/i.test(page.url());
          return inlineErrorVisible || isAuthErrorRoute;
        },
        { timeout: 15_000, intervals: [500, 1_000, 2_000] },
      )
      .toBe(true);
  });

  test("formulaire d'inscription valide les champs requis", async ({
    page,
  }) => {
    await page.goto("/compte");

    // Aller sur l'onglet inscription
    const registerTab = page
      .getByRole("tab", { name: /inscription|créer/i })
      .or(page.getByText(/inscription|créer un compte/i).first());
    await registerTab.click();

    // Champs présents
    await expect(page.locator("input[type='email']").last()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("input[type='password']").last()).toBeVisible();
  });
});
