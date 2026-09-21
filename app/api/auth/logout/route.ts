import { NextResponse, type NextRequest } from "next/server";
import { safeRelativeReturnPath, SESSION_COOKIE_NAME } from "@/app/auth";

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

function handleLogout(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("return_to") ?? "/";
  const safeReturnTo = safeRelativeReturnPath(returnTo);

  const response = NextResponse.redirect(new URL(safeReturnTo, request.url));

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
