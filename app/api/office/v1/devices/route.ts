import { z } from "zod";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import {
  DesktopApiRequestError,
  OFFICE_DESKTOP_PROTOCOL_VERSION,
  desktopJsonResponse,
  officeDesktopDeviceCreateSchema,
  readBoundedJson,
} from "@/features/office/desktop-sync-contract";
import {
  createOfficeDesktopDevice,
  listOfficeDesktopDevices,
  OfficeDesktopRepositoryError,
} from "@/features/office/desktop-sync-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEVICE_REQUEST_MAX_BYTES = 16 * 1024;

function unavailableResponse(error: unknown): Response {
  console.error("Office desktop device API failed.", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof OfficeDesktopRepositoryError ? error.code : "unexpected_error",
  });
  return desktopJsonResponse(
    { status: "error", code: "service_unavailable", message: "Desktop device management is temporarily unavailable." },
    503,
  );
}

export async function GET(): Promise<Response> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor?.memberId || actor.source !== "membership") {
    return desktopJsonResponse(
      { status: "error", code: "active_membership_required", message: "An active Office membership is required." },
      403,
    );
  }
  try {
    return desktopJsonResponse({
      protocolVersion: OFFICE_DESKTOP_PROTOCOL_VERSION,
      devices: await listOfficeDesktopDevices(actor.memberId),
    });
  } catch (error) {
    return unavailableResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor?.memberId || actor.source !== "membership") {
    return desktopJsonResponse(
      { status: "error", code: "active_membership_required", message: "An active Office membership is required." },
      403,
    );
  }

  try {
    const body = await readBoundedJson(request, DEVICE_REQUEST_MAX_BYTES);
    const input = officeDesktopDeviceCreateSchema.parse(body);
    const paired = await createOfficeDesktopDevice(input, actor);
    return desktopJsonResponse(
      {
        protocolVersion: OFFICE_DESKTOP_PROTOCOL_VERSION,
        device: paired.device,
        activation: {
          scheme: "OneTimeCode",
          code: paired.activationCode,
          apiOrigin: new URL(request.url).origin,
          expiresAt: paired.activationExpiresAt,
        },
      },
      201,
    );
  } catch (error) {
    if (error instanceof DesktopApiRequestError) {
      return desktopJsonResponse(
        { status: "error", code: "request_invalid", message: error.message },
        error.status,
      );
    }
    if (error instanceof z.ZodError) {
      return desktopJsonResponse(
        {
          status: "error",
          code: "validation_failed",
          message: error.issues[0]?.message ?? "Review the device details.",
        },
        400,
      );
    }
    if (error instanceof OfficeDesktopRepositoryError) {
      const status = error.code === "device_limit_reached" ? 409 : 403;
      return desktopJsonResponse(
        { status: "error", code: error.code, message: error.message },
        status,
      );
    }
    return unavailableResponse(error);
  }
}
