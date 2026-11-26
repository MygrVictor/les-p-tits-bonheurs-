import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SupplierImportForm } from "@/components/admin/supplier-import-form";

export const dynamic = "force-dynamic";

export default async function ImportFournisseurPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/produits"
          className="text-sm text-neutral-500 hover:text-ink"
        >
          ← Produits
        </Link>
        <h1 className="mt-2 font-serif text-4xl text-ink">
          Import fournisseur
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Déposez un fichier de specs fournisseur (.xlsx). Les produits et les
          catégories détectés vous sont présentés avant tout enregistrement :
          rien n’est écrit tant que vous n’avez pas validé.
        </p>
      </div>

      {brands.length === 0 ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Créez d’abord une marque dans{" "}
          <Link href="/admin/marques" className="underline">
            Marques
          </Link>{" "}
          : chaque produit importé doit être rattaché à une marque.
        </p>
      ) : (
        <SupplierImportForm brands={brands} categories={categories} />
      )}
    </div>
  );
}
