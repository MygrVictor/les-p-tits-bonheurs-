import Link from "next/link";
import { storefrontMainMenu } from "@/lib/menu";

function getUniqueLinks(
  links: { label: string; href: string }[],
): { label: string; href: string }[] {
  const seen = new Set<string>();

  return links.filter((link) => {
    const key = `${link.label}::${link.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function CategoryPills() {
  const categories = storefrontMainMenu;

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:overflow-visible">
        <div className="flex items-center gap-6 pb-3 sm:gap-8 lg:relative lg:z-30 lg:justify-center">
          {categories.map((category) => (
            <div key={category.label} className="group relative shrink-0">
              <Link
                href={category.href}
                className="inline-flex items-center whitespace-nowrap text-sm font-medium text-neutral-500 transition hover:text-primary"
              >
                {category.label}
              </Link>

              {category.sections?.length ? (
                <div className="pointer-events-none invisible absolute left-0 top-full z-40 mt-0 w-[min(90vw,44rem)] translate-y-1 rounded-2xl border border-blush-200 bg-blush-100 p-4 opacity-0 shadow-md transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {category.sections.map((section) => {
                      const sectionLinks = getUniqueLinks(section.links);

                      return (
                        <div key={`${category.label}-${section.title}`}>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-blush-700">
                            {section.title}
                          </p>
                          <div className="space-y-1">
                            {sectionLinks.map((link) => (
                              <Link
                                key={`${category.label}-${section.title}-${link.label}-${link.href}`}
                                href={link.href}
                                className="block rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-white hover:text-primary"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-neutral-200" />
    </div>
  );
}
