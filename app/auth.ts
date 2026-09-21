import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

export type ChatGPTUser = AuthUser; // Backwards-compatibility alias

export const SESSION_COOKIE_NAME = "abdullah_session";
const SIGN_IN_PATH = "/login";
const SIGN_OUT_PATH = "/api/auth/logout";
const DEFAULT_SECRET = "abdullah-properties-secure-session-key-joypurhat-2026";

function getSecret(): string {
  const envSecret = typeof process !== "undefined" ? process.env.AUTH_SECRET : undefined;
  return envSecret && envSecret.trim().length >= 16 ? envSecret.trim() : DEFAULT_SECRET;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createSessionToken(
  user: { email: string; displayName: string; fullName?: string | null },
  expiresInSeconds = 60 * 60 * 24 * 7, // 7 days
): Promise<string> {
  const key = await getHmacKey(getSecret());
  const payload = {
    email: user.email.toLowerCase().trim(),
    displayName: user.displayName.trim(),
    fullName: user.fullName?.trim() ?? null,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const encodedPayload = base64UrlEncode(payloadBytes);

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${encodedPayload}.${encodedSignature}`;
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  if (!token || !token.includes(".")) return null;

  try {
    const [encodedPayload, encodedSignature] = token.split(".");
    if (!encodedPayload || !encodedSignature) return null;

    const key = await getHmacKey(getSecret());
    const encoder = new TextEncoder();
    const signatureBytes = base64UrlDecode(encodedSignature);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(encodedPayload),
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson);

    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    if (!payload.email || typeof payload.email !== "string") {
      return null;
    }

    return {
      displayName: payload.displayName || payload.email,
      email: payload.email,
      fullName: payload.fullName ?? null,
    };
  } catch {
    return null;
  }
}

async function readAuthUser(): Promise<AuthUser | null> {
  // 1. Check HTTP-only session cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const user = await verifySessionToken(sessionCookie);
      if (user) return user;
    }
  } catch {
    // cookies() may throw in unsupported contexts; proceed to headers
  }

  // 2. Check Authorization header (Bearer token)
  try {
    const requestHeaders = await headers();
    const authHeader = requestHeaders.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const user = await verifySessionToken(token);
      if (user) return user;
    }

    // 3. Fallback for test or proxy headers
    const emailHeader =
      requestHeaders.get("x-auth-user-email") ??
      requestHeaders.get("oai-authenticated-user-email");
    if (emailHeader) {
      const nameHeader =
        requestHeaders.get("x-auth-user-name") ??
        requestHeaders.get("oai-authenticated-user-full-name");
      let displayName = emailHeader;
      if (nameHeader) {
        try {
          displayName = decodeURIComponent(nameHeader);
        } catch {
          displayName = nameHeader;
        }
      }
      return {
        displayName,
        email: emailHeader,
        fullName: displayName,
      };
    }

    // 4. Fallback for developer/preview environment variables if explicitly configured
    const devAuthEmail = process.env.DEV_AUTH_USER_EMAIL;
    if (devAuthEmail && process.env.NODE_ENV !== "production") {
      return {
        displayName: process.env.DEV_AUTH_USER_NAME ?? devAuthEmail.split("@")[0],
        email: devAuthEmail,
        fullName: process.env.DEV_AUTH_USER_NAME ?? null,
      };
    }
  } catch {
    // headers() may throw in unsupported contexts
  }

  return null;
}

/**
 * Authentication user is cached for the duration of a single Server Component request.
 */
export const getAuthUser = cache(readAuthUser);
export const getChatGPTUser = getAuthUser;

export async function requireAuthUser(returnTo: string): Promise<AuthUser> {
  const user = await getAuthUser();
  if (user) return user;

  redirect(signInPath(returnTo));
}
export const requireChatGPTUser = requireAuthUser;

export function signInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}
export const chatGPTSignInPath = signInPath;

export function signOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}
export const chatGPTSignOutPath = signOutPath;

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === "/signin-with-chatgpt" ||
    pathname === "/signout-with-chatgpt" ||
    pathname === "/callback"
  );
}
