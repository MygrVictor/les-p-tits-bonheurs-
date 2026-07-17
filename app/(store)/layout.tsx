import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { CategoryPills } from "@/components/store/category-pills";
import { CookieBanner } from "@/components/store/cookie-banner";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { ScrollToTopButton } from "@/components/store/scroll-to-top-button";
import { GoogleAnalytics } from "@/components/store/google-analytics";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? "";
  return (
    <div className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#fffdfd_0%,#fff8fa_46%,#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(217,120,149,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(242,196,206,0.18),transparent_28%),radial-gradient(circle_at_center,rgba(255,255,255,0.95),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-20 top-40 -z-10 h-64 w-64 rounded-full bg-[#f7d8e1]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-[26rem] -z-10 h-72 w-72 rounded-full bg-[#fdecef]/70 blur-3xl" />
      <StoreHeader />
      <div className="border-b border-neutral-100/80 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <CategoryPills />
        </div>
      </div>
      <main className="mx-auto min-h-screen max-w-[1440px] px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10 xl:px-10 2xl:px-12">
        {children}
      </main>
      <StoreFooter />
      <CookieBanner />
      <MobileBottomNav />
      <ScrollToTopButton />
      <GoogleAnalytics gaId={gaId} />
    </div>
  );
}
