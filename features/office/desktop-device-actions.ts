"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import { officeDesktopDeviceCreateSchema } from "@/features/office/desktop-sync-contract";
import {
  createOfficeDesktopDevice,
  revokeOfficeDesktopDevice,
} from "@/features/office/desktop-sync-repository";
import { hasOfficePermission } from "@/features/office/permissions";

const PAIRING_FLASH_COOKIE = "ap_office_pairing_flash_v1";
const pairingFlashSchema = z.strictObject({
  code: z.string().regex(/^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/),
  expiresAt: z.string().datetime({ offset: true }),
  deviceName: z.string().min(2).max(80),
});

export type OfficeDesktopPairingFlash = z.infer<typeof pairingFlashSchema>;

async function requireDeviceManager() {
  const actor = await getAuthorizedOfficeActor();
  if (!actor?.memberId || !hasOfficePermission(actor.role, "settings.manage")) {
    redirect("/office/settings?desktop=access-denied");
  }
  return actor;
}

export async function readOfficeDesktopPairingFlash(): Promise<OfficeDesktopPairingFlash | null> {
  const value = (await cookies()).get(PAIRING_FLASH_COOKIE)?.value;
  if (!value) return null;
  try {
    const parsed = pairingFlashSchema.parse(JSON.parse(value));
    return Date.parse(parsed.expiresAt) > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export async function createOfficeDesktopPairingAction(formData: FormData): Promise<never> {
  const actor = await requireDeviceManager();
  const input = officeDesktopDeviceCreateSchema.safeParse({
    name: formData.get("name"),
    platform: "windows",
  });
  if (!input.success) redirect("/office/settings?desktop=invalid-device-name");
  try {
    const paired = await createOfficeDesktopDevice(input.data, actor);
    (await cookies()).set(
      PAIRING_FLASH_COOKIE,
      JSON.stringify({
        code: paired.activationCode,
        expiresAt: paired.activationExpiresAt,
        deviceName: paired.device.name,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/office/settings",
        maxAge: 10 * 60,
      },
    );
    redirect("/office/settings?desktop=pairing-ready");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/office/settings?desktop=pairing-failed");
  }
}

export async function dismissOfficeDesktopPairingAction(): Promise<never> {
  (await cookies()).delete(PAIRING_FLASH_COOKIE);
  redirect("/office/settings?desktop=pairing-dismissed");
}

export async function revokeOfficeDesktopDeviceAction(formData: FormData): Promise<never> {
  const actor = await requireDeviceManager();
  const deviceId = z.string().uuid().safeParse(formData.get("deviceId"));
  if (!deviceId.success) redirect("/office/settings?desktop=invalid-device");
  try {
    await revokeOfficeDesktopDevice(deviceId.data, actor);
    redirect("/office/settings?desktop=revoked");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/office/settings?desktop=revoke-failed");
  }
}
