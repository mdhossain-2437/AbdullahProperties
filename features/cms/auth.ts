import { cache } from "react";
import { getAuthUser, requireAuthUser, type AuthUser } from "@/app/auth";

type RuntimeEnv = {
  CMS_ALLOWED_EMAILS?: string;
  CMS_OWNER_EMAILS?: string;
};

export type CmsRole = "owner" | "editor";

type CmsAuthorization = {
  editors: ReadonlySet<string>;
  owners: ReadonlySet<string>;
};

function emailSet(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

const cmsAuthorization = cache(async (): Promise<CmsAuthorization> => {
  let runtime: RuntimeEnv = {};
  try {
    const worker = await import("cloudflare:workers");
    runtime = worker.env as unknown as RuntimeEnv;
  } catch {
    runtime = {};
  }

  return {
    editors: emailSet(runtime.CMS_ALLOWED_EMAILS ?? process.env.CMS_ALLOWED_EMAILS),
    owners: emailSet(runtime.CMS_OWNER_EMAILS ?? process.env.CMS_OWNER_EMAILS),
  };
});

function roleForEmail(email: string, authorization: CmsAuthorization): CmsRole | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (authorization.owners.has(normalizedEmail)) return "owner";
  if (authorization.editors.has(normalizedEmail)) return "editor";
  return null;
}

const getCmsRoleForNormalizedEmail = cache(async (normalizedEmail: string): Promise<CmsRole | null> =>
  roleForEmail(normalizedEmail, await cmsAuthorization()),
);

export async function getCmsRole(email: string): Promise<CmsRole | null> {
  return getCmsRoleForNormalizedEmail(email.trim().toLowerCase());
}

export async function isCmsAdministrator(email: string) {
  return (await getCmsRole(email)) !== null;
}

export async function getCmsPageSession(returnTo: string) {
  const user = await requireAuthUser(returnTo);
  const authorization = await cmsAuthorization();
  const role = roleForEmail(user.email, authorization);

  return {
    user,
    role,
    configured: authorization.editors.size > 0 || authorization.owners.size > 0,
    authorized: role !== null,
  };
}

export type AuthorizedCmsActor = AuthUser & { role: CmsRole };

export async function getAuthorizedCmsActor(): Promise<AuthorizedCmsActor | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const role = await getCmsRole(user.email);
  return role ? { ...user, role } : null;
}
