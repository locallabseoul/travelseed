import type { Resort } from "@/types/resort";

type ResortNavigationProps = {
  resort: Resort;
  variant?: "light" | "dark" | "minimal";
};

const variantClassNames = {
  light: {
    brand: "text-white",
    link: "text-white/85 hover:text-white",
    button: "border-white/35 text-white hover:bg-white hover:text-[#18352f]",
    border: "border-white/20",
  },
  dark: {
    brand: "text-[#0c2f35]",
    link: "text-[#31585f] hover:text-[#0c2f35]",
    button: "border-[#0c2f35]/20 text-[#0c2f35] hover:bg-[#0c2f35] hover:text-white",
    border: "border-[#0c2f35]/10",
  },
  minimal: {
    brand: "text-[#202724]",
    link: "text-[#6f654f] hover:text-[#202724]",
    button: "border-[#202724]/20 text-[#202724] hover:bg-[#202724] hover:text-white",
    border: "border-[#ddd6c9]",
  },
};

// Customer-site navigation reused by every resort template.
export function ResortNavigation({ resort, variant = "light" }: ResortNavigationProps) {
  const styles = variantClassNames[variant];
  const links = [
    { href: "#about", label: "About" },
    { href: "#features", label: "Features" },
    resort.gallery.length > 0 ? { href: "#gallery", label: "Gallery" } : null,
    resort.experiences.length > 0 ? { href: "#experiences", label: "Experiences" } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <div className={`border-b ${styles.border}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <a href="#" className={`shrink-0 text-sm font-semibold tracking-[0.18em] ${styles.brand}`}>
          {resort.name}
        </a>
        <nav aria-label={`${resort.name} navigation`} className="flex min-w-0 items-center justify-end gap-1 sm:gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={`text-xs font-semibold uppercase tracking-[0.14em] ${styles.link}`}>
                {link.label}
              </a>
            ))}
          </div>
          <a
            href="#booking"
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${styles.button}`}
          >
            Book direct
          </a>
        </nav>
      </div>
    </div>
  );
}
