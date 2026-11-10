import { NextResponse } from "next/server";
import { z } from "zod";
import { searchRelayPoints } from "@/lib/mondial-relay";

const querySchema = z.object({
  postalCode: z.string().trim().min(4).max(10),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().length(2).optional(),
});

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    postalCode: searchParams.get("postalCode") ?? "",
    city: searchParams.get("city") ?? "",
    country: searchParams.get("country") ?? "FR",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres de recherche invalides." },
      { status: 400 },
    );
  }

  try {
    const result = await searchRelayPoints(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Impossible de récupérer les points relais pour le moment." },
      { status: 502 },
    );
  }
}
