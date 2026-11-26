import ExcelJS from "exceljs";

/**
 * Import de fichiers de specs fournisseur (.xlsx) vers le catalogue.
 *
 * Format attendu (constaté chez Studio Roof, mais volontairement tolérant) :
 *   - ligne 1 : groupes de colonnes fusionnées (PRODUCT DETAILS, PACKAGING
 *     DETAILS, CASEPACK DETAILS, MASTERPACK DETAILS) → purement décoratif,
 *     on l'ignore ;
 *   - ligne 2 : les vrais en-têtes ;
 *   - lignes suivantes : produits, entrecoupées de lignes « catégorie »
 *     (REF vide + Designation renseignée) qui s'appliquent à tous les
 *     produits jusqu'à la prochaine.
 *
 * Le repérage des colonnes se fait par libellé normalisé et non par index :
 * les fournisseurs insèrent/déplacent des colonnes d'une saison à l'autre.
 *
 * Ce module ne touche jamais la base : il produit un rapport que l'admin
 * valide (ou non) depuis l'écran de prévisualisation.
 */

export type SupplierSpecFields = {
  ean: string | null;
  origin: string | null;
  dimensionsCm: string | null;
  dimensionsInches: string | null;
  weightKg: number | null;
  weightOunces: number | null;
  packagingDimensionsCm: string | null;
  packagingDimensionsInches: string | null;
  casepackEan: string | null;
  casepackQty: number | null;
  casepackDimensions: string | null;
  casepackWeightKg: number | null;
  masterpackEan: string | null;
  masterpackQty: number | null;
  masterpackDimensions: string | null;
  masterpackNetWeightKg: number | null;
  masterpackGrossWeightKg: number | null;
};

export type ParsedProductRow = {
  supplierRef: string;
  name: string;
  categoryName: string | null;
  imageUrl: string | null;
  spec: SupplierSpecFields;
  sourceSheet: string;
  sourceRow: number;
  /** Anomalies non bloquantes (EAN douteux, image absente…). */
  warnings: string[];
};

export type RejectedRow = {
  sourceSheet: string;
  sourceRow: number;
  supplierRef: string | null;
  name: string | null;
  reason: string;
};

export type SupplierImportReport = {
  rows: ParsedProductRow[];
  rejected: RejectedRow[];
  categories: string[];
  sheets: Array<{ name: string; parsed: number; rejected: number }>;
};

/** Colonnes reconnues → variantes de libellés rencontrées dans les fichiers. */
const COLUMN_ALIASES: Record<string, string[]> = {
  supplierRef: ["ref", "reference", "sku", "article"],
  name: [
    "designation",
    "titre",
    "title",
    "nom",
    "libelle",
    "description",
    "product",
    "name",
    "item",
  ],
  origin: ["origin", "origine", "country of origin"],
  ean: ["ean"],
  dimensionsCm: ["dimension set up lxwxh cm", "dimension set up cm"],
  dimensionsInches: ["dimension set up inches", "dimension set up inch"],
  weightKg: ["weight kg"],
  weightOunces: ["weight ounces", "weight oz"],
  packagingDimensionsCm: ["dimension cm"],
  packagingDimensionsInches: ["dimension inches"],
  casepackEan: ["ean casepack", "casepack ean"],
  casepackQty: ["qtt casepack", "casepack qtt", "casepack qty"],
  casepackDimensions: ["dimension casepack", "casepack dimension"],
  casepackWeightKg: ["weight kg casepack", "casepack weight kg"],
  masterpackEan: ["ean masterpack", "masterpack ean"],
  masterpackQty: ["qtt masterpack", "masterpack qtt", "masterpack qty"],
  masterpackDimensions: ["dimension masterpack", "masterpack dimension"],
  masterpackNetWeightKg: ["netto weight kg", "net weight kg"],
  masterpackGrossWeightKg: ["gross weight kg"],
  imageUrl: ["pictures hr", "pictures", "picture hr", "image", "images"],
};

type ColumnKey = keyof typeof COLUMN_ALIASES;

/**
 * Normalise un libellé d'en-tête : casse, accents, ponctuation et
 * parenthèses sautent, ce qui permet de faire correspondre
 * « DIMENSION SET-UP (LxWxH) CM » et « dimension set up lxwxh cm ».
 */
export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()[\]]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * En-têtes strictement homonymes, répétés une fois par groupe de colonnes.
 * Le fichier ne les désambiguïse que par la ligne 1 fusionnée, souvent
 * absente ou incohérente ; on se rabat sur l'ordre d'apparition, lui stable :
 * produit d'abord, puis packaging, puis casepack, puis masterpack.
 */
const AMBIGUOUS_HEADERS: Record<string, ColumnKey[]> = {
  ean: ["ean", "casepackEan", "masterpackEan"],
  dimension: [
    "packagingDimensionsCm",
    "casepackDimensions",
    "masterpackDimensions",
  ],
  qtt: ["casepackQty", "masterpackQty"],
  qty: ["casepackQty", "masterpackQty"],
  "weight kg": ["weightKg", "casepackWeightKg"],
};

/**
 * Associe chaque colonne connue à son index dans la ligne d'en-tête.
 *
 * Deux stratégies : les libellés homonymes sont attribués au premier
 * emplacement encore libre de leur groupe ; les libellés explicites sont
 * résolus par alias, en privilégiant l'alias le plus long pour éviter qu'un
 * préfixe générique (« weight kg ») ne capture une colonne plus spécifique
 * (« weight kg casepack »).
 */
export function mapHeaderColumns(
  headerCells: string[],
): Partial<Record<ColumnKey, number>> {
  const mapping: Partial<Record<ColumnKey, number>> = {};
  const normalized = headerCells.map((cell) => normalizeHeader(cell ?? ""));

  normalized.forEach((header, index) => {
    if (!header) return;

    const ambiguousGroup = AMBIGUOUS_HEADERS[header];
    if (ambiguousGroup) {
      const key = ambiguousGroup.find((slot) => mapping[slot] === undefined);
      if (key) mapping[key] = index;
      return;
    }

    let bestKey: ColumnKey | null = null;
    let bestLength = 0;

    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      const typedKey = key as ColumnKey;
      if (mapping[typedKey] !== undefined) continue;

      for (const alias of aliases) {
        if (header !== alias && !header.startsWith(alias)) continue;
        if (alias.length > bestLength) {
          bestKey = typedKey;
          bestLength = alias.length;
        }
      }
    }

    if (bestKey) mapping[bestKey] = index;
  });

  return mapping;
}

/** Repère la ligne d'en-tête : la première contenant REF *et* un libellé. */
export function findHeaderRowIndex(rows: string[][]): number {
  const limit = Math.min(rows.length, 10);
  for (let index = 0; index < limit; index += 1) {
    const mapping = mapHeaderColumns(rows[index] ?? []);
    if (mapping.supplierRef !== undefined && mapping.name !== undefined) {
      return index;
    }
  }
  return -1;
}

/**
 * Nettoie un EAN : les fichiers fournisseur les saisissent avec des espaces
 * de lisibilité (« 8 720629644998 ») ou en notation scientifique quand Excel
 * les a interprétés comme des nombres.
 */
export function normalizeEan(raw: unknown): {
  value: string | null;
  warning: string | null;
} {
  const text = cellToString(raw);
  if (!text) return { value: null, warning: null };

  const digits = text.replace(/[\s\u00a0-]/g, "");
  if (!/^\d+$/.test(digits)) {
    return { value: null, warning: `EAN illisible ignoré : « ${text} »` };
  }
  if (digits.length !== 13 && digits.length !== 8 && digits.length !== 12) {
    return {
      value: digits,
      warning: `EAN de longueur inhabituelle (${digits.length} chiffres) : ${digits}`,
    };
  }
  if (!hasValidGtinChecksum(digits)) {
    return {
      value: digits,
      warning: `Clé de contrôle EAN invalide : ${digits}`,
    };
  }
  return { value: digits, warning: null };
}

/** Contrôle de la clé GTIN-8/12/13 (somme pondérée 3/1 de droite à gauche). */
export function hasValidGtinChecksum(digits: string): boolean {
  const values = digits.split("").map(Number);
  const check = values.pop();
  if (check === undefined) return false;

  const sum = values
    .reverse()
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10 === check;
}

/**
 * ExcelJS renvoie des objets pour les cellules enrichies : lien hypertexte
 * ({ text, hyperlink }), texte riche ({ richText }), formule ({ result }).
 * Sans ce dépliage on obtiendrait « [object Object] ».
 */
function unwrapExcelCell(value: unknown): unknown {
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const cell = value as {
      text?: unknown;
      richText?: Array<{ text: string }>;
      result?: unknown;
      hyperlink?: string;
    };
    if (Array.isArray(cell.richText)) {
      return cell.richText.map((part) => part.text).join("");
    }
    if (cell.text !== undefined) return unwrapExcelCell(cell.text);
    if (cell.result !== undefined) return cell.result;
    if (cell.hyperlink) return cell.hyperlink;
  }
  return value;
}

function cellToString(raw: unknown): string | null {
  const value = unwrapExcelCell(raw);
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    // Excel stocke parfois les EAN en nombre : on évite la notation
    // scientifique qui rendrait la valeur inexploitable.
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
  }
  const text = String(value)
    .replace(/\u00a0/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function cellToNumber(value: unknown): number | null {
  const text = cellToString(value);
  if (!text) return null;
  // Gère « 1,25 kg », « 0.4 », « 12 pcs ».
  const match = text.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function cellToInteger(value: unknown): number | null {
  const parsed = cellToNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

/**
 * Les fournisseurs partagent souvent leurs photos via Dropbox ou Google
 * Drive : ces liens ouvrent une page web, pas l'image. On les convertit en
 * lien de téléchargement direct.
 */
export function toDirectImageUrl(raw: string): string {
  const url = new URL(raw);

  if (url.hostname.endsWith("dropbox.com")) {
    url.searchParams.delete("dl");
    url.searchParams.set("raw", "1");
    return url.toString();
  }

  if (url.hostname === "drive.google.com") {
    const id =
      url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ??
      url.searchParams.get("id");
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  return url.toString();
}

function cellToUrl(value: unknown): string | null {
  // Une cellule « Cliquez ici » cache l'URL dans son lien hypertexte.
  const hyperlink =
    value && typeof value === "object"
      ? (value as { hyperlink?: string }).hyperlink
      : undefined;
  const text = hyperlink ?? cellToString(value);
  if (!text) return null;

  // Plusieurs liens dans la cellule : on garde le premier.
  const first = text.match(/https?:\/\/\S+/)?.[0];
  if (!first) return null;

  try {
    const url = new URL(first);
    return url.protocol === "http:" || url.protocol === "https:"
      ? toDirectImageUrl(url.toString())
      : null;
  } catch {
    return null;
  }
}

/**
 * Transforme les lignes brutes d'un onglet en produits + catégories.
 * Exporté séparément du décodage xlsx pour rester testable sans fichier.
 */
export function parseSheetRows(
  sheetName: string,
  rows: unknown[][],
): { rows: ParsedProductRow[]; rejected: RejectedRow[] } {
  const parsed: ParsedProductRow[] = [];
  const rejected: RejectedRow[] = [];

  const asText = rows.map((row) =>
    (row ?? []).map((cell) => cellToString(cell) ?? ""),
  );
  const headerIndex = findHeaderRowIndex(asText);

  if (headerIndex === -1) {
    return {
      rows: [],
      rejected: [
        {
          sourceSheet: sheetName,
          sourceRow: 0,
          supplierRef: null,
          name: null,
          reason:
            "Aucune ligne d'en-tête reconnue (colonnes « REF » et « Designation » introuvables).",
        },
      ],
    };
  }

  const columns = mapHeaderColumns(asText[headerIndex]);
  const read = (row: unknown[], key: ColumnKey): unknown => {
    const index = columns[key];
    return index === undefined ? null : row[index];
  };

  let currentCategory: string | null = null;

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    // Numéro de ligne tel qu'affiché dans Excel, pour que l'admin retrouve
    // la ligne fautive dans son propre fichier.
    const sourceRow = index + 1;

    const supplierRef = cellToString(read(row, "supplierRef"));
    const name = cellToString(read(row, "name"));

    if (!supplierRef && !name) continue; // ligne de séparation vide

    // Ligne « catégorie » : pas de REF, un libellé seul.
    if (!supplierRef && name) {
      currentCategory = name;
      continue;
    }

    if (supplierRef && !name) {
      rejected.push({
        sourceSheet: sheetName,
        sourceRow,
        supplierRef,
        name: null,
        reason: "Désignation manquante",
      });
      continue;
    }

    const warnings: string[] = [];
    const ean = normalizeEan(read(row, "ean"));
    if (ean.warning) warnings.push(ean.warning);

    const casepackEan = normalizeEan(read(row, "casepackEan"));
    const masterpackEan = normalizeEan(read(row, "masterpackEan"));

    const imageUrl = cellToUrl(read(row, "imageUrl"));
    if (!imageUrl) warnings.push("Aucune image exploitable (« Pictures HR »)");
    if (!currentCategory) {
      warnings.push("Aucune catégorie de section au-dessus de cette ligne");
    }

    parsed.push({
      supplierRef: supplierRef as string,
      name: name as string,
      categoryName: currentCategory,
      imageUrl,
      sourceSheet: sheetName,
      sourceRow,
      warnings,
      spec: {
        ean: ean.value,
        origin: cellToString(read(row, "origin")),
        dimensionsCm: cellToString(read(row, "dimensionsCm")),
        dimensionsInches: cellToString(read(row, "dimensionsInches")),
        weightKg: cellToNumber(read(row, "weightKg")),
        weightOunces: cellToNumber(read(row, "weightOunces")),
        packagingDimensionsCm: cellToString(read(row, "packagingDimensionsCm")),
        packagingDimensionsInches: cellToString(
          read(row, "packagingDimensionsInches"),
        ),
        casepackEan: casepackEan.value,
        casepackQty: cellToInteger(read(row, "casepackQty")),
        casepackDimensions: cellToString(read(row, "casepackDimensions")),
        casepackWeightKg: cellToNumber(read(row, "casepackWeightKg")),
        masterpackEan: masterpackEan.value,
        masterpackQty: cellToInteger(read(row, "masterpackQty")),
        masterpackDimensions: cellToString(read(row, "masterpackDimensions")),
        masterpackNetWeightKg: cellToNumber(read(row, "masterpackNetWeightKg")),
        masterpackGrossWeightKg: cellToNumber(
          read(row, "masterpackGrossWeightKg"),
        ),
      },
    });
  }

  return { rows: parsed, rejected };
}

/** Signale les REF présentes plusieurs fois : le dernier écraserait le premier. */
function flagDuplicates(rows: ParsedProductRow[]): {
  kept: ParsedProductRow[];
  rejected: RejectedRow[];
} {
  const seen = new Map<string, ParsedProductRow>();
  const rejected: RejectedRow[] = [];

  for (const row of rows) {
    const key = row.supplierRef.toUpperCase();
    const previous = seen.get(key);
    if (previous) {
      rejected.push({
        sourceSheet: row.sourceSheet,
        sourceRow: row.sourceRow,
        supplierRef: row.supplierRef,
        name: row.name,
        reason: `REF en doublon (déjà vue ligne ${previous.sourceRow} de « ${previous.sourceSheet} »)`,
      });
      continue;
    }
    seen.set(key, row);
  }

  return { kept: [...seen.values()], rejected };
}

/** Assemble le rapport final à partir des onglets (ou du CSV unique) bruts. */
function buildReport(
  rawSheets: Array<{ name: string; rows: unknown[][] }>,
): SupplierImportReport {
  const allRows: ParsedProductRow[] = [];
  const allRejected: RejectedRow[] = [];
  const sheets: SupplierImportReport["sheets"] = [];

  for (const sheet of rawSheets) {
    const result = parseSheetRows(sheet.name, sheet.rows);
    allRows.push(...result.rows);
    allRejected.push(...result.rejected);
    sheets.push({
      name: sheet.name,
      parsed: result.rows.length,
      rejected: result.rejected.length,
    });
  }

  const { kept, rejected: duplicates } = flagDuplicates(allRows);
  const categories = [
    ...new Set(
      kept
        .map((row) => row.categoryName)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  return {
    rows: kept,
    rejected: [...allRejected, ...duplicates],
    categories,
    sheets,
  };
}

/** Décode un classeur .xlsx complet et produit le rapport de prévisualisation. */
export async function parseSupplierWorkbook(
  buffer: ArrayBuffer,
): Promise<SupplierImportReport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const rawSheets: Array<{ name: string; rows: unknown[][] }> = [];
  workbook.eachSheet((worksheet) => {
    const rows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values = row.values as unknown[];
      // ExcelJS indexe les colonnes à partir de 1 : on retire la case 0.
      rows.push(values.slice(1));
    });
    rawSheets.push({ name: worksheet.name, rows });
  });

  return buildReport(rawSheets);
}

/**
 * Décode le contenu binaire d'un CSV. Excel en français exporte souvent en
 * Windows-1252 : si l'UTF-8 strict échoue, on bascule dessus.
 */
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  return text.replace(/^\uFEFF/, "");
}

/**
 * Devine le séparateur : Excel FR utilise « ; », les exports anglo-saxons
 * « , », certains outils la tabulation. On compte hors guillemets.
 */
export function detectCsvDelimiter(text: string): string {
  const sample = text.slice(0, 5000);
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  let inQuotes = false;
  for (const char of sample) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && char in counts) counts[char] += 1;
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? best : ",";
}

/**
 * Parseur CSV conforme RFC 4180 : champs entre guillemets, guillemets
 * doublés, retours à la ligne dans une cellule (fréquents dans les en-têtes
 * fournisseurs du type « WEIGHT↵KG »), fins de ligne CRLF/LF/CR.
 */
export function parseCsvText(text: string, delimiter?: string): string[][] {
  const sep = delimiter ?? detectCsvDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true;
    } else if (char === sep) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** Décode un fichier .csv fournisseur et produit le rapport de prévisualisation. */
export function parseSupplierCsv(
  buffer: ArrayBuffer,
  fileName = "CSV",
): SupplierImportReport {
  const rows = parseCsvText(decodeCsvBuffer(buffer));
  return buildReport([{ name: fileName, rows }]);
}

export function isSupportedImportFile(fileName: string): boolean {
  return /\.(xlsx|csv)$/i.test(fileName);
}

/** Point d'entrée unique : choisit le décodeur selon l'extension. */
export async function parseSupplierFile(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<SupplierImportReport> {
  return /\.csv$/i.test(fileName)
    ? parseSupplierCsv(buffer, fileName)
    : parseSupplierWorkbook(buffer);
}
