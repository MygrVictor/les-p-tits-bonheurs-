import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        where: { status: "ACTIVE" },
        select: {
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const payload = categories.map((category) => {
    const brandMap = new Map<string, { id: string; name: string }>();

    for (const product of category.products) {
      if (!brandMap.has(product.brand.id)) {
        brandMap.set(product.brand.id, product.brand);
      }
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      brands: Array.from(brandMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      ),
    };
  });

  return NextResponse.json(payload);
}
