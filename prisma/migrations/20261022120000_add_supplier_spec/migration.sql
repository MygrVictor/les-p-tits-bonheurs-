-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sku" TEXT;

-- CreateTable
CREATE TABLE "ProductSupplierSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierRef" TEXT NOT NULL,
    "ean" TEXT,
    "origin" TEXT,
    "dimensionsCm" TEXT,
    "dimensionsInches" TEXT,
    "weightKg" DOUBLE PRECISION,
    "weightOunces" DOUBLE PRECISION,
    "packagingDimensionsCm" TEXT,
    "packagingDimensionsInches" TEXT,
    "casepackEan" TEXT,
    "casepackQty" INTEGER,
    "casepackDimensions" TEXT,
    "casepackWeightKg" DOUBLE PRECISION,
    "masterpackEan" TEXT,
    "masterpackQty" INTEGER,
    "masterpackDimensions" TEXT,
    "masterpackNetWeightKg" DOUBLE PRECISION,
    "masterpackGrossWeightKg" DOUBLE PRECISION,
    "sourceSheet" TEXT,
    "sourceRow" INTEGER,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSupplierSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplierSpec_productId_key" ON "ProductSupplierSpec"("productId");

-- CreateIndex
CREATE INDEX "ProductSupplierSpec_ean_idx" ON "ProductSupplierSpec"("ean");

-- CreateIndex
CREATE INDEX "ProductSupplierSpec_supplierRef_idx" ON "ProductSupplierSpec"("supplierRef");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- AddForeignKey
ALTER TABLE "ProductSupplierSpec" ADD CONSTRAINT "ProductSupplierSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

