-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "color" TEXT;

-- CreateIndex
CREATE INDEX "Product_color_idx" ON "Product"("color");
