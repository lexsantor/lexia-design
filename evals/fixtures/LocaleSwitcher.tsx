// Eval fixture: locale switcher built on client-side navigation, which keeps
// the previous locale in cached context (LD-I18N-02).
import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCALES = ["es", "ca"] as const;

export function LocaleSwitcher({ current }: { current: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Language">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={pathname.replace(/^\/[a-z]{2}/, `/${locale}`)}
          aria-current={locale === current ? "true" : undefined}
        >
          {locale === "es" ? "🇪🇸" : "🇪🇸"} {locale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
