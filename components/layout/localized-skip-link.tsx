"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/public-locale";
import { publicShellCopy } from "@/lib/i18n/public-navigation";

export function LocalizedSkipLink() {
  const locale = localeFromPathname(usePathname());

  return (
    <a className="skip-link" href="#main-content" lang={locale}>
      {publicShellCopy[locale].skip}
    </a>
  );
}

