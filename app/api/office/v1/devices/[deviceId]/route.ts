import { z } from "zod";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import {
  OFFICE_DESKTOP_PROTOCOL_VERSION,
  desktopJsonResponse,
} from "@/features/office/desktop-sync-contract";
import {
  OfficeDesktopRepositoryError,
  revokeOfficeDesktopDevice,
} from "@/features/office/desktop-sync-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
): Promise<Response> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor?.memberId || actor.source !== "membership") {
    return desktopJsonResponse(
      { status: "error", code: "active_membership_required", message: "An active Office membership is required." },
      403,
    );
  }

  try {
    const deviceId = z.string().uuid().parse((await params).deviceId);
    const device = await revokeOfficeDesktopDevice(deviceId, actor);
    return desktopJsonResponse({
      protocolVersion: OFFICE_DESKTOP_PROTOCOL_VERSION,
      device,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return desktopJsonResponse(
        { status: "error", code: "device_id_invalid", message: "The desktop device identifier is invalid." },
        400,
      );
    }
    if (error instanceof OfficeDesktopRepositoryError) {
      const status = error.code === "device_not_found" ? 404 : 403;
      return desktopJsonResponse({ status: "error", code: error.code, message: error.message }, status);
    }
    console.error("Office desktop device revocation failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return desktopJsonResponse(
      { status: "error", code: "service_unavailable", message: "The desktop device could not be revoked." },
      503,
    );
  }
}
