import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSupportedImportFile,
  parseSupplierFile,
} from "@/lib/backoffice/supplier-import";

/**
 * Prévisualisation d'un fichier de specs fournisseur.
 *
 * Volontairement un Route Handler et non une Server Action : celles-ci sont
 * plafonnées à 1 Mo de payload par défaut, ce qui est trop juste pour un
 * classeur de plusieurs onglets. Rien n'est écrit ici — l'écriture se fait
 * dans l'action `commitSupplierImport`, après validation par l'admin.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  if (!isSupportedImportFile(file.name)) {
    return NextResponse.json(
      {
        error:
          "Format non supporté : seuls les fichiers .xlsx et .csv sont acceptés.",
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (10 Mo maximum)." },
      { status: 413 },
    );
  }

  let report;
  try {
    report = await parseSupplierFile(file.name, await file.arrayBuffer());
  } catch (error) {
    console.error("[import-fournisseur] Échec du parsing du classeur :", error);
    return NextResponse.json(
      { error: "Fichier illisible ou corrompu." },
      { status: 422 },
    );
  }

  // On indique dès la prévisualisation ce qui sera créé vs mis à jour, pour
  // que l'admin sache exactement ce qu'il déclenche avant de valider.
  const refs = report.rows.map((row) => row.supplierRef);
  const existing = await prisma.product.findMany({
    where: { sku: { in: refs } },
    select: { sku: true },
  });
  const existingRefs = new Set(
    existing.map((product) => product.sku).filter(Boolean) as string[],
  );

  const existingCategories = await prisma.category.findMany({
    where: { name: { in: report.categories } },
    select: { name: true },
  });
  const knownCategories = new Set(
    existingCategories.map((category) => category.name.toLowerCase()),
  );

  return NextResponse.json({
    fileName: file.name,
    sheets: report.sheets,
    rejected: report.rejected,
    categories: report.categories.map((name) => ({
      name,
      isNew: !knownCategories.has(name.toLowerCase()),
    })),
    rows: report.rows.map((row) => ({
      ...row,
      operation: existingRefs.has(row.supplierRef) ? "update" : "create",
    })),
  });
}
