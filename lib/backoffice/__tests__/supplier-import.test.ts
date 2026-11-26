import { describe, expect, it } from "vitest";
import {
  findHeaderRowIndex,
  hasValidGtinChecksum,
  mapHeaderColumns,
  normalizeEan,
  normalizeHeader,
  parseSheetRows,
} from "../supplier-import";

const HEADER = [
  "REF",
  "Designation",
  "Origin",
  "EAN",
  "DIMENSION SET-UP (LxWxH) CM",
  "DIMENSION SET-UP INCHES",
  "WEIGHT KG",
  "WEIGHT OUNCES",
  "DIMENSION CM",
  "DIMENSION INCHES",
  "EAN",
  "Qtt",
  "Dimension",
  "Weight kg",
  "EAN",
  "Qtt",
  "Dimension",
  "Netto Weight kg",
  "Gross Weight kg",
  "Pictures HR",
];

function productRow(ref: string, name: string, ean = "8 720629644998") {
  return [
    ref,
    name,
    "China",
    ean,
    "20x10x30",
    "8x4x12",
    "0,4",
    "14.1",
    "22x12x5",
    "9x5x2",
    "",
    "12",
    "40x30x30",
    "5",
    "",
    "48",
    "80x60x60",
    "20",
    "22",
    "https://cdn.example.com/img.jpg",
  ];
}

describe("normalizeHeader", () => {
  it("aplatit casse, accents et ponctuation", () => {
    expect(normalizeHeader("DIMENSION SET-UP (LxWxH) CM")).toBe(
      "dimension set up lxwxh cm",
    );
  });
});

describe("hasValidGtinChecksum", () => {
  it("accepte un EAN-13 valide", () => {
    expect(hasValidGtinChecksum("8720629644998")).toBe(true);
  });

  it("rejette une clé de contrôle erronée", () => {
    expect(hasValidGtinChecksum("8720629644991")).toBe(false);
  });
});

describe("normalizeEan", () => {
  it("supprime les espaces de lisibilité", () => {
    expect(normalizeEan("8 720629644998").value).toBe("8720629644998");
  });

  it("convertit les EAN stockés en nombre par Excel", () => {
    expect(normalizeEan(8720629644998).value).toBe("8720629644998");
  });

  it("signale un EAN non numérique sans le conserver", () => {
    const result = normalizeEan("N/A");
    expect(result.value).toBeNull();
    expect(result.warning).toContain("illisible");
  });

  it("conserve une valeur vide sans alerte", () => {
    expect(normalizeEan("")).toEqual({ value: null, warning: null });
  });
});

describe("mapHeaderColumns", () => {
  it("affecte les colonnes EAN homonymes dans l'ordre des groupes", () => {
    const mapping = mapHeaderColumns(HEADER);
    expect(mapping.ean).toBe(3);
    expect(mapping.casepackEan).toBe(10);
    expect(mapping.masterpackEan).toBe(14);
  });

  it("distingue les dimensions packaging, casepack et masterpack", () => {
    const mapping = mapHeaderColumns(HEADER);
    expect(mapping.casepackDimensions).toBe(12);
    expect(mapping.masterpackDimensions).toBe(16);
  });

  it("reste insensible à l'ordre des colonnes", () => {
    const mapping = mapHeaderColumns(["Designation", "REF"]);
    expect(mapping.name).toBe(0);
    expect(mapping.supplierRef).toBe(1);
  });
});

describe("findHeaderRowIndex", () => {
  it("ignore la ligne 1 de groupes fusionnés", () => {
    const rows = [["PRODUCT DETAILS", "", "", "", "PACKAGING DETAILS"], HEADER];
    expect(findHeaderRowIndex(rows)).toBe(1);
  });

  it("renvoie -1 si aucun en-tête exploitable", () => {
    expect(
      findHeaderRowIndex([
        ["a", "b"],
        ["c", "d"],
      ]),
    ).toBe(-1);
  });
});

describe("parseSheetRows", () => {
  const sheet = [
    ["PRODUCT DETAILS", "", "", "", "PACKAGING DETAILS"],
    HEADER,
    ["", "ARTIST'S BOUQUETS"],
    productRow("AB-01", "Bouquet cerisier"),
    ["", "SMALL INSECTS"],
    productRow("SI-01", "Coccinelle"),
    productRow("SI-02", "Libellule"),
  ];

  it("rattache chaque produit à sa section courante", () => {
    const { rows } = parseSheetRows("Bestseller collection 2026", sheet);
    expect(rows).toHaveLength(3);
    expect(rows[0].categoryName).toBe("ARTIST'S BOUQUETS");
    expect(rows[1].categoryName).toBe("SMALL INSECTS");
    expect(rows[2].categoryName).toBe("SMALL INSECTS");
  });

  it("extrait et type les données de specs", () => {
    const { rows } = parseSheetRows("Onglet", sheet);
    expect(rows[0].spec.ean).toBe("8720629644998");
    expect(rows[0].spec.weightKg).toBe(0.4);
    expect(rows[0].spec.casepackQty).toBe(12);
    expect(rows[0].spec.masterpackGrossWeightKg).toBe(22);
    expect(rows[0].imageUrl).toBe("https://cdn.example.com/img.jpg");
  });

  it("conserve la provenance de chaque ligne", () => {
    const { rows } = parseSheetRows("Wider collections", sheet);
    expect(rows[0].sourceSheet).toBe("Wider collections");
    expect(rows[0].sourceRow).toBe(4);
  });

  it("rejette une ligne sans désignation", () => {
    const { rows, rejected } = parseSheetRows("Onglet", [
      HEADER,
      ["ORPHAN", ""],
    ]);
    expect(rows).toHaveLength(0);
    expect(rejected[0].reason).toBe("Désignation manquante");
  });

  it("alerte sans bloquer quand l'image ou la catégorie manquent", () => {
    const row = productRow("NO-IMG", "Sans visuel");
    row[19] = "";
    const { rows } = parseSheetRows("Onglet", [HEADER, row]);
    expect(rows).toHaveLength(1);
    expect(rows[0].warnings).toHaveLength(2);
  });

  it("tolère les champs vides des displays (ni casepack ni masterpack)", () => {
    const row = productRow("DISP-01", "Display comptoir", "");
    for (const index of [10, 11, 12, 13, 14, 15, 16, 17, 18]) row[index] = "";

    const { rows } = parseSheetRows("Onglet", [HEADER, ["", "DISPLAYS"], row]);
    expect(rows[0].spec.casepackQty).toBeNull();
    expect(rows[0].spec.masterpackGrossWeightKg).toBeNull();
    expect(rows[0].categoryName).toBe("DISPLAYS");
  });

  it("signale un onglet sans en-tête reconnaissable", () => {
    const { rejected } = parseSheetRows("Notes", [["Lorem"], ["ipsum"]]);
    expect(rejected[0].reason).toContain("Aucune ligne d'en-tête");
  });
});
