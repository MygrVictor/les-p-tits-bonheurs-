import { FeaturedGrid } from "@/components/store/featured-grid";
import { AboutSnippet } from "@/components/store/about-snippet";
import { NewBrandsCarousel } from "@/components/store/new-brands-carousel";
import { BentoBoutique } from "@/components/store/bento-boutique";

export const dynamic = "force-dynamic";

export default function StoreHomePage() {
  return (
    <div className="space-y-8">
      <NewBrandsCarousel />
      <FeaturedGrid />
      <BentoBoutique />
    </div>
  );
}
