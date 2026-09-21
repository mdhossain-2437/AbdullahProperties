import { cache } from "react";
import { getAuthUser, requireAuthUser, type AuthUser } from "@/app/auth";
import { getD1 } from "@/db";
import { getCmsRole } from "@/features/cms/auth";
import {
  hasOfficePermission,
  type OfficePermission,
  type OfficeRole,
} from "@/features/office/permissions";
import {
  officeMembershipSchema,
  type OfficeMembership,
} from "@/features/office/types";
import { z } from "zod";

type OfficeMembershipRow = {
  id: string;
  email: string;
  normalized_email: string;
  display_name: string;
  role: string;
  status: string;
  version: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthorizedOfficeActor = AuthUser & {
  memberId: string | null;
  role: OfficeRole;
  source: "membership" | "cms_owner_bootstrap";
};

export type OfficeAccessErrorCode = "office_membership_required" | "office_permission_required";

export class OfficeAccessError extends Error {
  readonly code: OfficeAccessErrorCode;
  readonly status = 403;

  constructor(code: OfficeAccessErrorCode, message: string) {
    super(message);
    this.name = "OfficeAccessError";
    this.code = code;
  }
}

const normalizedEmailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());

function membershipFromRow(row: OfficeMembershipRow): OfficeMembership {
  return officeMembershipSchema.parse({
    id: row.id,
    email: row.email,
    normalizedEmail: row.normalized_email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    version: row.version,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function isOfficeMembershipStoreUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.message === "The CMS database is unavailable in this runtime.") return true;
  return /(?:D1_ERROR:\s*)?no such table:\s*office_members\b/i.test(error.message);
}

const getOfficeMembershipByNormalizedEmail = cache(async (
  normalizedEmail: string,
): Promise<OfficeMembership | null> => {
  let row: OfficeMembershipRow | null;
  try {
    row = await (await getD1())
      .prepare(
        "SELECT id, email, normalized_email, display_name, role, status, version, last_seen_at, created_at, updated_at FROM office_members WHERE normalized_email = ? LIMIT 1",
      )
      .bind(normalizedEmail)
      .first<OfficeMembershipRow>();
  } catch (error) {
    if (isOfficeMembershipStoreUnavailable(error)) return null;
    throw error;
  }

  return row ? membershipFromRow(row) : null;
});

export async function getOfficeMembershipByEmail(email: string): Promise<OfficeMembership | null> {
  return getOfficeMembershipByNormalizedEmail(normalizedEmailSchema.parse(email));
}

const resolveOfficeActor = cache(async (user: AuthUser): Promise<AuthorizedOfficeActor | null> => {
  const membership = await getOfficeMembershipByEmail(user.email);
  if (membership) {
    if (membership.status !== "active") return null;
    return {
      ...user,
      memberId: membership.id,
      role: membership.role,
      source: "membership",
    };
  }

  if ((await getCmsRole(user.email)) !== "owner") return null;
  return {
    ...user,
    memberId: null,
    role: "owner",
    source: "cms_owner_bootstrap",
  };
});

export async function getAuthorizedOfficeActor(): Promise<AuthorizedOfficeActor | null> {
  const user = await getAuthUser();
  return user ? resolveOfficeActor(user) : null;
}

export async function getOfficePageSession(returnTo: string) {
  const user = await requireAuthUser(returnTo);
  const actor = await resolveOfficeActor(user);
  return {
    user,
    actor,
    authorized: actor !== null,
  };
}

export async function requireOfficeActor(returnTo = "/office"): Promise<AuthorizedOfficeActor> {
  const user = await requireAuthUser(returnTo);
  const actor = await resolveOfficeActor(user);
  if (!actor) {
    throw new OfficeAccessError(
      "office_membership_required",
      "An active Abdullah Properties office membership is required.",
    );
  }
  return actor;
}

export function assertOfficePermission(
  actor: Pick<AuthorizedOfficeActor, "role">,
  permission: OfficePermission,
): void {
  if (hasOfficePermission(actor.role, permission)) return;
  throw new OfficeAccessError(
    "office_permission_required",
    `Office permission ${permission} is required for this operation.`,
  );
}

export async function requireOfficePermission(
  permission: OfficePermission,
  returnTo = "/office",
): Promise<AuthorizedOfficeActor> {
  const actor = await requireOfficeActor(returnTo);
  assertOfficePermission(actor, permission);
  return actor;
}
