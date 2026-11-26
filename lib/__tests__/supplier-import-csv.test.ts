import { describe, expect, it } from "vitest";
import {
  detectCsvDelimiter,
  parseCsvText,
  parseSupplierCsv,
} from "@/lib/backoffice/supplier-import";

const encode = (text: string) => new TextEncoder().encode(text).buffer;

// Reproduit l'en-tête réel du fichier fournisseur (export Excel FR, « ; »).
const SUPPLIER_CSV = [
  ";;;PRODUCT DETAILS;;;;;PACKAGING DETAILS;;;CASEPACK DETAILS;;;;MASTERPACK DETAILS;;;;;",
  'REF;titre;Origin;EAN;"DIMENSION\nSET-UP\n(LxWxH) CM";"DIMENSION SET-UP\n INCHES";"WEIGHT\nKG";"WEIGHT\nOUNCES";"DIMENSION\nCM";"DIMENSION\nINCHES";EAN;Qtt;"Dimension\n(lenght x width x height) (cm)";"Weight\n(kg)";EAN;Qtt;"Dimension\n(lenght x width x height) (cm)";"Netto Weight\n(kg)";"Gross Weight\n(kg)";Pictures HR',
  ";Bijoux;;;;;;;;;;;;;;;;;;",
  "SR-001;Collier perle;China;4006381333931;10x5x1;4x2x0.4;0,05;1,7;12x6x2;;;6;;0,4;;48;;3;3,5;https://example.com/sr-001.jpg",
  "SR-002;Bracelet;India;;;;;;;;;;;;;;;;;",
].join("\r\n");

describe("parseCsvText", () => {
  it("gère guillemets, retours à la ligne internes et CRLF", () => {
    const rows = parseCsvText('a;"b\nc";"d ""e"""\r\n1;2;3', ";");
    expect(rows).toEqual([
      ["a", "b\nc", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });

  it("détecte le séparateur", () => {
    expect(detectCsvDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectCsvDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectCsvDelimiter("a\tb\tc")).toBe("\t");
  });
});

describe("parseSupplierCsv", () => {
  it("ignore la ligne de groupes et lit les produits", () => {
    const report = parseSupplierCsv(encode(SUPPLIER_CSV), "studio-roof.csv");

    expect(report.rows).toHaveLength(2);
    const [first, second] = report.rows;

    expect(first.supplierRef).toBe("SR-001");
    expect(first.name).toBe("Collier perle");
    expect(first.categoryName).toBe("Bijoux");
    expect(first.imageUrl).toBe("https://example.com/sr-001.jpg");
    expect(first.spec.ean).toBe("4006381333931");
    expect(first.spec.origin).toBe("China");
    expect(first.spec.dimensionsCm).toBe("10x5x1");
    expect(first.spec.weightKg).toBe(0.05);
    expect(first.spec.casepackQty).toBe(6);
    expect(first.spec.masterpackQty).toBe(48);

    expect(second.warnings).toContain(
      "Aucune image exploitable (« Pictures HR »)",
    );
  });

  it("décode un fichier Windows-1252 (Excel)", () => {
    const latin1 = new Uint8Array([
      ...new TextEncoder().encode("REF;titre\nA1;Bo"),
      0xee, // î
      ...new TextEncoder().encode("te\n"),
    ]);
    const report = parseSupplierCsv(latin1.buffer);
    expect(report.rows[0].name).toBe("Boîte");
  });
});
