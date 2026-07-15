import { type NextRequest, NextResponse } from "next/server";
import { localeFromPathname } from "@/lib/i18n/public-locale";

const LOCALE_REQUEST_HEADER = "x-abdullah-public-locale";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER, localeFromPathname(request.nextUrl.pathname));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-icon.png|pwa-512.png).*)"],
};
