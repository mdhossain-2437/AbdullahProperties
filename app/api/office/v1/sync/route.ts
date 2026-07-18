import { z } from "zod";
import {
  DesktopApiRequestError,
  OFFICE_DESKTOP_MAX_REQUEST_BYTES,
  OFFICE_DESKTOP_PROTOCOL_VERSION,
  desktopJsonResponse,
  officeDesktopSyncRequestSchema,
  officeDesktopSyncResponseSchema,
  readBearerCredential,
  readBoundedJson,
} from "@/features/office/desktop-sync-contract";
import {
  authenticateOfficeDesktopCredential,
  consumeOfficeDesktopIngressRateLimit,
  consumeOfficeDesktopRateLimit,
  markOfficeDesktopDeviceSeen,
  syncOfficeDesktopOperation,
} from "@/features/office/desktop-sync-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function unauthorized(): Response {
  return desktopJsonResponse(
    { status: "error", code: "device_credential_invalid", message: "A valid active desktop credential is required." },
    401,
    { "WWW-Authenticate": 'Bearer realm="Abdullah Properties Office", error="invalid_token"' },
  );
}

export async function POST(request: Request): Promise<Response> {
  const credential = readBearerCredential(request);
  if (!credential) return unauthorized();

  try {
    const now = new Date();
    const ingress = await consumeOfficeDesktopIngressRateLimit(request, credential, now);
    if (!ingress.allowed) {
      return desktopJsonResponse(
        {
          status: "error",
          code: "ingress_rate_limited",
          message: "Too many desktop authentication attempts. Retry after the current window.",
        },
        429,
        { "Retry-After": String(ingress.retryAfterSeconds) },
      );
    }
    const authorization = await authenticateOfficeDesktopCredential(credential, now);
    if (!authorization) return unauthorized();

    const rate = await consumeOfficeDesktopRateLimit(authorization.device.id, now);
    const rateHeaders = {
      "RateLimit-Limit": String(rate.limit),
      "RateLimit-Remaining": String(rate.remaining),
      "RateLimit-Reset": rate.resetAt,
    };
    if (!rate.allowed) {
      return desktopJsonResponse(
        { status: "error", code: "rate_limited", message: "Too many desktop sync requests. Retry after the current window." },
        429,
        { ...rateHeaders, "Retry-After": "60" },
      );
    }

    const body = await readBoundedJson(request, OFFICE_DESKTOP_MAX_REQUEST_BYTES);
    const parsed = officeDesktopSyncRequestSchema.parse(body);
    const results = [];
    for (const operation of parsed.operations) {
      results.push(await syncOfficeDesktopOperation(operation, authorization, now));
    }
    await markOfficeDesktopDeviceSeen(authorization.device.id, now);

    const response = officeDesktopSyncResponseSchema.parse({
      protocolVersion: OFFICE_DESKTOP_PROTOCOL_VERSION,
      serverTime: now.toISOString(),
      results,
    });
    return desktopJsonResponse(response, 200, rateHeaders);
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
          message: error.issues[0]?.message ?? "The desktop sync envelope is invalid.",
        },
        400,
      );
    }
    console.error("Office desktop sync failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return desktopJsonResponse(
      { status: "error", code: "service_unavailable", message: "Desktop sync is temporarily unavailable." },
      503,
    );
  }
}
