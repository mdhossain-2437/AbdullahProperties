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
    background-color: #0A0A0A;
    background-image: radial-gradient(circle at 50% 0%, rgba(255, 107, 44, 0.08) 0%, transparent 60%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 3rem 1rem;
    color: #FBF9F8;
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
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background-color: rgba(255, 107, 44, 0.12);
    border: 1px solid rgba(255, 107, 44, 0.25);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #FF8243;
    margin-bottom: 0.75rem;
  }
  .login-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #FFFFFF;
    margin: 0 0 0.5rem 0;
  }
  .login-desc {
    font-size: 0.875rem;
    color: #9E9893;
    margin: 0;
    line-height: 1.5;
  }
  .login-card {
    background-color: #141414;
    padding: 2rem;
    border-radius: 0.875rem;
    border: 1px solid #262320;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04);
  }
  .login-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: 0.5rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #FCA5A5;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }
  .login-form-group {
    margin-bottom: 1.25rem;
  }
  .login-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #D5CFCA;
    margin-bottom: 0.375rem;
  }
  .login-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.625rem 0.875rem;
    min-height: 44px;
    font-size: 0.875rem;
    color: #FFFFFF;
    background-color: #1D1A18;
    border: 1px solid #332F2C;
    border-radius: 0.5rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .login-input::placeholder {
    color: #736C66;
  }
  .login-input:focus {
    border-color: #FF6B2C;
    box-shadow: 0 0 0 2px rgba(255, 107, 44, 0.25);
    background-color: #221E1B;
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
    font-weight: 700;
    letter-spacing: 0.01em;
    color: #0C0C0C;
    background-color: #FF6B2C;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.1s ease;
  }
  .login-btn:hover {
    background-color: #E55A1F;
  }
  .login-btn:active {
    transform: scale(0.99);
  }
  .login-btn:focus-visible {
    outline: 2px solid #FF6B2C;
    outline-offset: 2px;
  }
  .login-footer {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid #221F1D;
    text-align: center;
    font-size: 0.75rem;
    color: #78736E;
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
    envPassword || "abdullah2026";

  const allowedEmails = (process.env.CMS_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const ownerEmails = (process.env.CMS_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isOwnerOrEditor =
    (ownerEmails.length === 0 && allowedEmails.length === 0) ||
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
  const isHttps =
    proto === "https" ||
    headersList.get("referer")?.startsWith("https://") === true ||
    headersList.get("origin")?.startsWith("https://") === true;

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
            <BrandLogo tone="light" />
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

