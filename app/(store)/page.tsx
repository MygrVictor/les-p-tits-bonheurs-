import { FeaturedGrid } from "@/components/store/featured-grid";
import { AboutSnippet } from "@/components/store/about-snippet";
import { NouveautesCarousel } from "@/components/store/nouveautes-carousel";
import { BandeauCharly } from "@/components/store/bandeau-charly";
import { BandeauZag } from "@/components/store/bandeau-zag";
import { BentoBoutique } from "@/components/store/bento-boutique";

export const dynamic = "force-dynamic";

export default function StoreHomePage() {
  return (
    <div className="space-y-8">
      <NouveautesCarousel />

      {/* Bandeaux marques — pleine largeur, décalés via la marge de l'étiquette */}
      <div className="-mx-4 space-y-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
        <BandeauCharly />
        <BandeauZag />
      </div>
      <FeaturedGrid />
      <BentoBoutique />
    </div>
  );
}
