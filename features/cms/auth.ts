import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";

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

async function cmsAuthorization(): Promise<CmsAuthorization> {
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
}

function roleForEmail(email: string, authorization: CmsAuthorization): CmsRole | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (authorization.owners.has(normalizedEmail)) return "owner";
  if (authorization.editors.has(normalizedEmail)) return "editor";
  return null;
}

export async function getCmsRole(email: string): Promise<CmsRole | null> {
  return roleForEmail(email, await cmsAuthorization());
}

export async function isCmsAdministrator(email: string) {
  return (await getCmsRole(email)) !== null;
}

export async function getCmsPageSession(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  const authorization = await cmsAuthorization();
  const role = roleForEmail(user.email, authorization);

  return {
    user,
    role,
    configured: authorization.editors.size > 0 || authorization.owners.size > 0,
    authorized: role !== null,
  };
}

export type AuthorizedCmsActor = ChatGPTUser & { role: CmsRole };

export async function getAuthorizedCmsActor(): Promise<AuthorizedCmsActor | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const role = await getCmsRole(user.email);
  return role ? { ...user, role } : null;
}
