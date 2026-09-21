import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  createSessionToken,
  getAuthUser,
  safeRelativeReturnPath,
  timingSafeEqualStrings,
  SESSION_COOKIE_NAME,
} from "@/app/auth";
import { LockKeyhole, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Workspace Sign In | Abdullah Properties",
  description: "Secure access to Abdullah Properties Office OS and Content Studio.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

type RateLimitRecord = { count: number; resetAt: number; lockedUntil?: number };
const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      allowed: false,
      waitSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  if (now > record.resetAt) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return {
      allowed: false,
      waitSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
    }
  }
}

function clearRateLimit(key: string): void {
  loginAttempts.delete(key);
}


const loginStyles = `
  .login-page {
    min-height: 100vh;
    background-color: #FBF9F8;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 3rem 1rem;
    color: #0C0C0C;
    box-sizing: border-box;
  }
  .login-card-container {
    width: 100%;
    max-width: 28rem;
    margin: 0 auto;
  }
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .login-logo-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .login-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #802900;
    margin-bottom: 0.5rem;
  }
  .login-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0C0C0C;
    margin: 0 0 0.5rem 0;
  }
  .login-desc {
    font-size: 0.875rem;
    color: #555555;
    margin: 0;
  }
  .login-card {
    background-color: #FFFFFF;
    padding: 2rem;
    border-radius: 0.75rem;
    border: 1px solid #E5E0DB;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .login-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #FEF2F2;
    border: 1px solid #FECACA;
    color: #B91C1C;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }
  .login-form-group {
    margin-bottom: 1.25rem;
  }
  .login-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #222222;
    margin-bottom: 0.375rem;
  }
  .login-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.625rem 0.875rem;
    min-height: 44px;
    font-size: 0.875rem;
    color: #0C0C0C;
    background-color: #FFFFFF;
    border: 1px solid #D5CFCA;
    border-radius: 0.5rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .login-input:focus {
    border-color: #FF6B2C;
    box-shadow: 0 0 0 2px rgba(255, 107, 44, 0.2);
  }
  .login-btn {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    min-height: 44px;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #FFFFFF;
    background-color: #0C0C0C;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .login-btn:hover {
    background-color: #FF6B2C;
  }
  .login-btn:focus-visible {
    outline: 2px solid #FF6B2C;
    outline-offset: 2px;
  }
  .login-footer {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #EAE6E2;
    text-align: center;
    font-size: 0.75rem;
    color: #777777;
    line-height: 1.5;
  }
`;

type LoginPageProps = {
  searchParams: Promise<{
    return_to?: string;
    error?: string;
  }>;
};

async function authenticateAction(formData: FormData) {
  "use server";

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string)?.trim();
  const rawReturnTo = (formData.get("return_to") as string)?.trim() || "/office";
  const returnTo = safeRelativeReturnPath(rawReturnTo);

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "client";
  const rateLimitKey = `${ip}:${email || "anonymous"}`;

  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    redirect(`/login?error=rate_limited&return_to=${encodeURIComponent(returnTo)}`);
  }

  if (!email || !email.includes("@")) {
    recordFailedAttempt(rateLimitKey);
    redirect(`/login?error=invalid_email&return_to=${encodeURIComponent(returnTo)}`);
  }

  if (!password) {
    recordFailedAttempt(rateLimitKey);
    redirect(`/login?error=missing_password&return_to=${encodeURIComponent(returnTo)}`);
  }

  // Authorize against configured admin/owner/editor emails and credentials
  const envPassword = process.env.AUTH_PASSWORD ?? process.env.ADMIN_KEY;
  const effectivePassword =
    envPassword || (process.env.NODE_ENV !== "production" ? "abdullah2026" : undefined);

  const allowedEmails = (process.env.CMS_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const ownerEmails = (process.env.CMS_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isOwnerOrEditor =
    ownerEmails.length === 0 ||
    ownerEmails.includes(email) ||
    allowedEmails.includes(email);

  if (!effectivePassword || !isOwnerOrEditor || !timingSafeEqualStrings(password, effectivePassword)) {
    recordFailedAttempt(rateLimitKey);
    // Artificial delay to mitigate brute force timing attacks
    await new Promise((resolve) => setTimeout(resolve, 300));
    redirect(`/login?error=invalid_credentials&return_to=${encodeURIComponent(returnTo)}`);
  }

  // Clear failed attempts upon successful authentication
  clearRateLimit(rateLimitKey);

  const displayName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const token = await createSessionToken({
    email,
    displayName,
    fullName: displayName,
  });

  const proto = headersList.get("x-forwarded-proto");
  const host = headersList.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.includes(".local");
  const isHttps = proto === "https" || (!isLocalhost && process.env.NODE_ENV === "production");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect(returnTo);
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getAuthUser();
  const query = await searchParams;
  const returnTo = safeRelativeReturnPath(query.return_to || "/office");

  if (user) {
    redirect(returnTo);
  }

  const errorMessage =
    query.error === "rate_limited"
      ? "Too many failed sign-in attempts. Please wait 15 minutes before trying again."
      : query.error === "invalid_credentials"
        ? "Invalid email or access key. Please check your credentials."
        : query.error === "invalid_email"
          ? "Please enter a valid email address."
          : query.error === "missing_password"
            ? "Please enter your access key or password."
            : null;


  return (
    <div className="login-page">
      <style>{loginStyles}</style>
      <div className="login-card-container">
        <div className="login-header">
          <div className="login-logo-wrap">
            <BrandLogo tone="dark" />
          </div>
          <div className="login-badge">
            <ShieldCheck style={{ width: "1rem", height: "1rem", color: "#FF6B2C" }} aria-hidden="true" />
            <span>Operational Workspace</span>
          </div>
          <h1 className="login-title">
            Sign in to Abdullah Properties
          </h1>
          <p className="login-desc">
            Access Office OS and Content Studio with your authorized credentials.
          </p>
        </div>

        <div className="login-card">
          {errorMessage ? (
            <div
              className="login-alert"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle style={{ width: "1.25rem", height: "1.25rem", color: "#EF4444", flexShrink: 0 }} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form action={authenticateAction}>
            <input type="hidden" name="return_to" value={returnTo} />

            <div className="login-form-group">
              <label
                htmlFor="email"
                className="login-label"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@abdullah-properties.com"
                className="login-input"
              />
            </div>

            <div className="login-form-group">
              <label
                htmlFor="password"
                className="login-label"
              >
                Access key / Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                className="login-input"
              />
            </div>

            <button
              type="submit"
              className="login-btn"
            >
              <LockKeyhole style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              <span>Authorize & Continue</span>
              <ArrowRight style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            </button>
          </form>

          <div className="login-footer">
            Protected internal operations for Abdullah Properties.
            <br />
            Pouro Market, Joypurhat, Bangladesh.
          </div>
        </div>
      </div>
    </div>
  );
}
