export const publicLocales = ["en-BD", "bn-BD"] as const;

export type PublicLocale = (typeof publicLocales)[number];

export const bengaliPublicPaths = [
  "/",
  "/about",
  "/services",
  "/properties",
  "/projects",
  "/solutions",
  "/buyers",
  "/landowners",
  "/joint-venture",
  "/process",
  "/quality",
  "/client-care",
  "/resources",
  "/property-planner",
  "/area-guides",
  "/insights",
  "/faq",
  "/contact",
  "/brand-kit",
  "/privacy",
  "/terms",
  "/cookies",
  "/property-disclaimer",
  "/accessibility",
] as const;

export type BengaliPublicPath = (typeof bengaliPublicPaths)[number];

const bengaliPublicPathSet = new Set<string>(bengaliPublicPaths);

function normalizePathname(pathname: string) {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  if (withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "") || "/";
}

export function isBengaliPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return normalized === "/bn" || normalized.startsWith("/bn/");
}

export function localeFromPathname(pathname: string): PublicLocale {
  return isBengaliPath(pathname) ? "bn-BD" : "en-BD";
}

export function stripBengaliPrefix(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/bn") return "/";
  return normalized.startsWith("/bn/") ? normalized.slice(3) || "/" : normalized;
}

export function isPublishedBengaliPath(pathname: string): pathname is BengaliPublicPath {
  return bengaliPublicPathSet.has(normalizePathname(pathname));
}

export function toBengaliPath(pathname: string) {
  const englishPath = stripBengaliPrefix(pathname);
  return isPublishedBengaliPath(englishPath)
    ? englishPath === "/" ? "/bn" : `/bn${englishPath}`
    : "/bn";
}

export function toEnglishPath(pathname: string) {
  return stripBengaliPrefix(pathname);
}

export function localizedPublicHref(href: string, locale: PublicLocale) {
  if (locale === "en-BD" || href.startsWith("#") || /^(?:https?:|mailto:|tel:)/.test(href)) {
    return href;
  }

  if (href === "/office" || href === "/studio") return href;
  return toBengaliPath(href);
}

export function publicLanguageAlternates(pathname: string) {
  const englishPath = stripBengaliPrefix(pathname);
  if (!isPublishedBengaliPath(englishPath)) return null;

  return {
    "en-BD": englishPath,
    "bn-BD": toBengaliPath(englishPath),
    "x-default": englishPath,
  } as const;
}

export function bengaliPathFromSegments(segments?: readonly string[]): BengaliPublicPath | null {
  const path = segments && segments.length > 0 ? `/${segments.join("/")}` : "/";
  return isPublishedBengaliPath(path) ? path : null;
}

