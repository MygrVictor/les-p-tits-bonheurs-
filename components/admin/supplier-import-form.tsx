"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { AlertTriangle, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { commitSupplierImport } from "@/app/(admin)/admin/produits/import/actions";

type PreviewRow = {
  supplierRef: string;
  name: string;
  categoryName: string | null;
  imageUrl: string | null;
  sourceSheet: string;
  sourceRow: number;
  warnings: string[];
  operation: "create" | "update";
  spec: Record<string, string | number | null>;
};

type RejectedRow = {
  sourceSheet: string;
  sourceRow: number;
  supplierRef: string | null;
  name: string | null;
  reason: string;
};

type Preview = {
  fileName: string;
  sheets: Array<{ name: string; parsed: number; rejected: number }>;
  rows: PreviewRow[];
  rejected: RejectedRow[];
  categories: Array<{ name: string; isNew: boolean }>;
};

type Summary = {
  created: number;
  updated: number;
  skipped: Array<{ supplierRef: string; reason: string }>;
  categoriesCreated: string[];
  imageFailures?: string[];
};

type Option = { id: string; name: string };

type Props = {
  brands: Option[];
  categories: Option[];
};

export function SupplierImportForm({ brands, categories }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [isCommitting, startCommit] = useTransition();

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setSummary(null);
    setPreview(null);

    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError("Format non supporté : sélectionnez un fichier .xlsx ou .csv.");
      return;
    }

    setIsParsing(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/import-fournisseur", {
        method: "POST",
        body,
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Échec de l'analyse du fichier.");
        return;
      }
      setPreview(payload as Preview);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const handleConfirm = () => {
    if (!preview || !brandId) return;

    startCommit(async () => {
      const result = await commitSupplierImport({
        brandId,
        parentCategoryId: parentCategoryId || null,
        rows: preview.rows.map((row) => ({
          supplierRef: row.supplierRef,
          name: row.name,
          categoryName: row.categoryName,
          imageUrl: row.imageUrl,
          sourceSheet: row.sourceSheet,
          sourceRow: row.sourceRow,
          spec: row.spec as never,
        })),
      });

      if (result?.data) {
        setSummary(result.data as Summary);
        setPreview(null);
      } else {
        setError(
          result?.serverError ?? "L'import a échoué. Aucune donnée écrite.",
        );
      }
    });
  };

  const createCount =
    preview?.rows.filter((row) => row.operation === "create").length ?? 0;
  const updateCount =
    preview?.rows.filter((row) => row.operation === "update").length ?? 0;

  return (
    <div className="space-y-8">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition ${
          isDragging
            ? "border-primary bg-blush-50"
            : "border-neutral-300 bg-white hover:border-primary"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
            event.target.value = "";
          }}
        />
        {isParsing ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-primary" />
        )}
        <p className="mt-4 text-sm font-medium text-ink">
          {isParsing
            ? "Analyse du fichier en cours…"
            : "Glissez le fichier fournisseur ici, ou cliquez pour le sélectionner"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Fichiers .xlsx ou .csv — 10 Mo maximum. Rien n’est enregistré avant
          votre validation.
        </p>
      </div>

      {error ? (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {summary ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6">
          <h2 className="font-serif text-2xl text-ink">Import terminé</h2>
          <ul className="mt-4 space-y-1 text-sm text-neutral-700">
            <li>{summary.created} produit(s) créé(s)</li>
            <li>{summary.updated} produit(s) mis à jour</li>
            <li>{summary.skipped.length} ligne(s) ignorée(s)</li>
            {summary.imageFailures && summary.imageFailures.length > 0 ? (
              <li>
                Photo non récupérée (lien privé ou invalide) :{" "}
                {summary.imageFailures.join(", ")}
              </li>
            ) : null}
            {summary.categoriesCreated.length > 0 ? (
              <li>
                Catégories créées : {summary.categoriesCreated.join(", ")}
              </li>
            ) : null}
          </ul>
          {summary.skipped.length > 0 ? (
            <ul className="mt-4 space-y-1 text-xs text-neutral-500">
              {summary.skipped.map((item) => (
                <li key={item.supplierRef}>
                  {item.supplierRef} — {item.reason}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-xs text-neutral-500">
            Les produits importés sont en brouillon, sans prix ni description.
            Complétez-les depuis la liste des produits avant publication.
          </p>
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              {preview.fileName}
            </div>
            <p className="mt-3 text-sm text-neutral-700">
              {createCount} création(s), {updateCount} mise(s) à jour,{" "}
              {preview.rejected.length} ligne(s) en erreur.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Onglets analysés :{" "}
              {preview.sheets
                .map((sheet) => `${sheet.name} (${sheet.parsed})`)
                .join(", ")}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink">Marque</span>
                <select
                  value={brandId}
                  onChange={(event) => setBrandId(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-neutral-300 px-4 py-2"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-ink">
                  Catégorie parente (optionnel)
                </span>
                <select
                  value={parentCategoryId}
                  onChange={(event) => setParentCategoryId(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-neutral-300 px-4 py-2"
                >
                  <option value="">Créer à la racine</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {preview.categories.map((category) => (
                <span
                  key={category.name}
                  className={`rounded-full px-3 py-1 text-xs ${
                    category.isNew
                      ? "bg-blush-50 text-primary"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {category.name}
                  {category.isNew ? " — nouvelle" : ""}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCommitting || !brandId || preview.rows.length === 0}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCommitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Valider l’import de {preview.rows.length} produit(s)
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">REF</th>
                  <th className="px-4 py-3">Désignation</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">EAN</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Alertes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.rows.map((row) => (
                  <tr key={`${row.sourceSheet}-${row.sourceRow}`}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.supplierRef}
                    </td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.categoryName ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                      {(row.spec.ean as string) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          row.operation === "create"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.operation === "create"
                          ? "Création"
                          : "Mise à jour"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {row.warnings.length > 0 ? row.warnings.join(" · ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.rejected.length > 0 ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-sm font-semibold text-red-800">
                Lignes non importables ({preview.rejected.length})
              </h3>
              <ul className="mt-3 space-y-1 text-xs text-red-700">
                {preview.rejected.map((row, index) => (
                  <li key={`${row.sourceSheet}-${row.sourceRow}-${index}`}>
                    {row.sourceSheet} · ligne {row.sourceRow} —{" "}
                    {row.supplierRef ?? "sans REF"} : {row.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
