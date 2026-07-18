import { type NextRequest, NextResponse } from "next/server";
import { localeFromPathname } from "@/lib/i18n/public-locale";

const LOCALE_REQUEST_HEADER = "x-abdullah-public-locale";
const OFFICE_RETURN_TO_REQUEST_HEADER = "x-abdullah-office-return-to";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const isOfficeRoute =
    request.nextUrl.pathname === "/office" || request.nextUrl.pathname.startsWith("/office/");
  requestHeaders.set(LOCALE_REQUEST_HEADER, localeFromPathname(request.nextUrl.pathname));
  requestHeaders.set(
    OFFICE_RETURN_TO_REQUEST_HEADER,
    isOfficeRoute
      ? `${request.nextUrl.pathname}${request.nextUrl.search}`
      : "/office",
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-icon.png|pwa-512.png).*)"],
};
