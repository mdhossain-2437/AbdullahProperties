import { z } from "zod";
import {
  DesktopApiRequestError,
  OFFICE_DESKTOP_PROTOCOL_VERSION,
  desktopJsonResponse,
  officeDesktopDeviceActivateSchema,
  readBoundedJson,
} from "@/features/office/desktop-sync-contract";
import {
  activateOfficeDesktopDevice,
  consumeOfficeDesktopIngressRateLimit,
  OfficeDesktopRepositoryError,
} from "@/features/office/desktop-sync-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVATION_REQUEST_MAX_BYTES = 4 * 1024;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readBoundedJson(request, ACTIVATION_REQUEST_MAX_BYTES);
    const input = officeDesktopDeviceActivateSchema.parse(body);
    const now = new Date();
    const ingress = await consumeOfficeDesktopIngressRateLimit(request, input.code, now);
    if (!ingress.allowed) {
      return desktopJsonResponse(
        {
          status: "error",
          code: "ingress_rate_limited",
          message: "Too many pairing attempts. Generate a new code and retry later.",
        },
        429,
        { "Retry-After": String(ingress.retryAfterSeconds) },
      );
    }
    const activated = await activateOfficeDesktopDevice(input, now);
    return desktopJsonResponse({
      protocolVersion: OFFICE_DESKTOP_PROTOCOL_VERSION,
      device: activated.device,
      credential: {
        scheme: "Bearer",
        token: activated.credential,
        expiresAt: activated.device.expiresAt,
      },
    });
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
          message: error.issues[0]?.message ?? "Review the pairing code.",
        },
        400,
      );
    }
    if (error instanceof OfficeDesktopRepositoryError && error.code === "activation_invalid") {
      return desktopJsonResponse(
        { status: "error", code: error.code, message: error.message },
        401,
        { "WWW-Authenticate": 'OneTimeCode realm="Abdullah Properties Office"' },
      );
    }
    console.error("Office desktop activation failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return desktopJsonResponse(
      {
        status: "error",
        code: "service_unavailable",
        message: "Desktop activation is temporarily unavailable.",
      },
      503,
    );
  }
}
