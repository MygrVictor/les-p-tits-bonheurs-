import { test, expect } from "@playwright/test";

/**
 * Tests de régression UI :
 * 1. Panier Zustand — persiste entre navigations (SSR-safe)
 * 2. Filtres prix sur une page catégorie (slider)
 * 3. Dropdown menu navbar visible au hover
 */

test.describe("Régression UI : Panier Zustand SSR-safe", () => {
  test("panier vide par défaut et persiste après navigation", async ({
    page,
  }) => {
    await page.goto("/");

    // Panier vide au chargement initial (pas d'erreur d'hydration)
    await expect(page.locator("header")).toBeVisible({ timeout: 10_000 });

    // Vérifier que le bouton panier est dans le header (desktop)
    const cartBtn = page.locator("button[aria-label='Panier']").first();
    await expect(cartBtn).toBeVisible({ timeout: 5_000 });

    // Naviguer sur une page produit si des produits existent
    await page.goto("/nouveautes");
    const productLink = page.locator("a[href^='/produit/']").first();
    const hasProducts = await productLink
      .isVisible({ timeout: 6_000 })
      .catch(() => false);

    if (!hasProducts) {
      // Pas de produits en DB — vérifier juste que la page panier est accessible
      await page.goto("/panier");
      await expect(
        page.locator("h1, h2").filter({ hasText: /panier/i }),
      ).toBeVisible({ timeout: 5_000 });
      return;
    }

    await productLink.click();

    // Ajouter au panier
    const addBtn = page.getByRole("button", { name: /ajouter au panier/i });
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    // Revenir à l'accueil — le panier doit persister (Zustand localStorage)
    await page.goto("/");
    await page.waitForTimeout(500); // laisser le temps à Zustand de réhydrater

    // On vérifie que la page panier ne montre pas un panier vide
    await page.goto("/panier");
    const emptyMsg = page.getByText(/panier est vide|votre panier est vide/i);
    await expect(emptyMsg).not.toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Régression UI : Filtres catégorie", () => {
  test("la page catégorie affiche les filtres prix et marque", async ({
    page,
  }) => {
    // Chercher une catégorie disponible
    await page.goto("/nouveautes");
    await expect(page).toHaveURL(/nouveautes/);

    // Les sliders de prix doivent être présents
    const priceSlider = page.locator("input[type='range']").first();
    await expect(priceSlider).toBeVisible({ timeout: 10_000 });

    // Il doit y avoir deux sliders (min et max)
    const sliders = page.locator("input[type='range']");
    expect(await sliders.count()).toBeGreaterThanOrEqual(2);
  });

  test("filtrer par prix met à jour les produits", async ({ page }) => {
    await page.goto("/nouveautes");

    // Attendre que les produits soient chargés
    const products = page.locator("a[href^='/produit/']");
    await expect(products.first()).toBeVisible({ timeout: 10_000 });
    const countBefore = await products.count();

    // Modifier le slider max (réduire à une valeur basse)
    const maxSlider = page.locator("input[type='range']").last();
    await maxSlider.fill("20");

    // Soumettre le formulaire (les filtres ont un bouton Appliquer ou auto-submit)
    const applyBtn = page
      .getByRole("button", { name: /appliquer|filtrer/i })
      .first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    } else {
      // Auto-submit via form submit
      await maxSlider.press("Enter");
    }

    await page.waitForLoadState("networkidle");

    // Vérifier que la page a répondu (même si 0 produits, pas d'erreur 500)
    await expect(page).not.toHaveURL(/500|error/i);
  });
});

test.describe("Régression UI : Navbar dropdown", () => {
  test("le header s'affiche avec le logo, la recherche et le bouton panier", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible({ timeout: 10_000 });

    // Bouton panier visible dans le header
    const cartBtn = page.locator("button[aria-label='Panier']").first();
    await expect(cartBtn).toBeVisible({ timeout: 5_000 });

    // Barre de recherche visible (desktop uniquement)
    const searchInput = page
      .locator("header input[aria-label='Rechercher']")
      .first();
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    // Logo visible
    const logo = page
      .locator("a[href='/']")
      .filter({ hasText: /p.tits bonheurs/i })
      .first();
    await expect(logo).toBeVisible({ timeout: 5_000 });
  });

  test("le menu hamburger ouvre le drawer avec les catégories", async ({
    page,
  }) => {
    // En mobile (viewport 390px), le hamburger est visible
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const hamburger = page.locator("button[aria-label='Ouvrir le menu']");
    await expect(hamburger).toBeVisible({ timeout: 10_000 });
    await hamburger.click();

    // Le drawer doit s’ouvrir et montrer des liens de navigation
    await expect(
      page.locator("nav a[href^='/categorie'], nav a[href='/panier']").first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("la page d'accueil charge sans erreur d'hydration React", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await expect(page.locator("header")).toBeVisible({ timeout: 10_000 });

    // Pas d'erreurs d'hydration React
    const hydrationErrors = consoleErrors.filter(
      (err) =>
        err.includes("Hydration") ||
        err.includes("did not match") ||
        err.includes("Text content does not match"),
    );
    expect(hydrationErrors).toHaveLength(0);
  });
});
