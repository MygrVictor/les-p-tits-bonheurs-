import { FeaturedGrid } from "@/components/store/featured-grid";
import { NewBrandsCarousel } from "@/components/store/new-brands-carousel";
import { CategoryDiscoveryBento } from "@/components/store/category-discovery-bento";
import { BentoBoutique } from "@/components/store/bento-boutique";

export const dynamic = "force-dynamic";

export default function StoreHomePage() {
  return (
    <div className="space-y-8">
      <NewBrandsCarousel />
      <CategoryDiscoveryBento />
      <FeaturedGrid />
      <BentoBoutique />
    </div>
  );
}
