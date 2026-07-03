import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { CategoryPills } from "@/components/store/category-pills";
import { CookieBanner } from "@/components/store/cookie-banner";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <StoreHeader />
      {/* Titre de la boutique — fond blanc sous la navbar rose */}
      <div className="border-b border-neutral-100 bg-white px-4 py-4 text-center sm:px-6 lg:px-8">
        <p className="font-serif text-2xl text-ink sm:text-3xl">
          Les P&apos;tits Bonheurs
        </p>
      </div>
      {/* Navigation catégories */}
      <div className="border-b border-neutral-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <CategoryPills />
        </div>
      </div>
      <main className="mx-auto min-h-screen max-w-7xl bg-white px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:pt-10 lg:px-8">
        {children}
      </main>
      <StoreFooter />
      <CookieBanner />
      <MobileBottomNav />
    </>
  );
}
