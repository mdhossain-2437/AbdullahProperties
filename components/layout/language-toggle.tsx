import Link from "next/link";
import {
  isPublishedBengaliPath,
  localeFromPathname,
  stripBengaliPrefix,
  toBengaliPath,
  toEnglishPath,
} from "@/lib/i18n/public-locale";
import styles from "@/components/layout/explore-navigation.module.css";

type LanguageToggleProps = {
  readonly pathname: string;
};

export function LanguageToggle({ pathname }: LanguageToggleProps) {
  const locale = localeFromPathname(pathname);
  const englishPath = stripBengaliPrefix(pathname);
  const hasExactBengaliPage = isPublishedBengaliPath(englishPath);
  const bengaliHref = toBengaliPath(pathname);
  const englishHref = toEnglishPath(pathname);

  return (
    <nav className={styles.languageToggle} aria-label={locale === "bn-BD" ? "ভাষা নির্বাচন" : "Choose language"}>
      <Link
        className={styles.languageOption}
        href={englishHref}
        hrefLang="en-BD"
        lang="en"
        aria-current={locale === "en-BD" ? "page" : undefined}
        aria-label="View this page in English"
      >
        EN
      </Link>
      <Link
        className={styles.languageOption}
        href={bengaliHref}
        hrefLang="bn-BD"
        lang="bn"
        aria-current={locale === "bn-BD" ? "page" : undefined}
        aria-label={hasExactBengaliPage ? "এই পাতাটি বাংলায় দেখুন" : "এই পাতার বাংলা সংস্করণ এখনো নেই; বাংলা হোমপেজ দেখুন"}
        title={hasExactBengaliPage ? "বাংলা" : "বাংলা হোমপেজ"}
        data-fallback={hasExactBengaliPage ? undefined : "home"}
      >
        বাংলা
      </Link>
    </nav>
  );
}

