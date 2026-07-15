import { SITE_URL } from "@/lib/company-data";

export const trackingPrefixes = ["inv", "rct", "ntc"] as const;

export type TrackingPrefix = (typeof trackingPrefixes)[number];

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const TRACKING_PATTERN = /^(?:inv|rct|ntc)_[A-Za-z0-9_-]{22}$/;

function encodeBase64Url(bytes: Uint8Array): string {
  let accumulator = 0;
  let bitCount = 0;
  let encoded = "";

  for (const byte of bytes) {
    accumulator = (accumulator << 8) | byte;
    bitCount += 8;

    while (bitCount >= 6) {
      bitCount -= 6;
      encoded += BASE64_URL_ALPHABET[(accumulator >>> bitCount) & 63];
      accumulator &= (1 << bitCount) - 1;
    }
  }

  if (bitCount > 0) {
    encoded += BASE64_URL_ALPHABET[(accumulator << (6 - bitCount)) & 63];
  }

  return encoded;
}

export function createTrackingCode(prefix: TrackingPrefix): string {
  const entropy = new Uint8Array(16);
  crypto.getRandomValues(entropy);
  return `${prefix}_${encodeBase64Url(entropy)}`;
}

export function isTrackingCode(value: string): boolean {
  return TRACKING_PATTERN.test(value);
}

export function trackingUrl(code: string): string {
  if (!isTrackingCode(code)) throw new TypeError("Tracking code is invalid.");
  return `${SITE_URL}/track/${encodeURIComponent(code)}`;
}

export function maskRecipientName(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Private recipient";

  return parts
    .map((part) => {
      const characters = Array.from(part);
      if (characters.length === 1) return `${characters[0]}•`;
      return `${characters[0]}${"•".repeat(Math.min(4, characters.length - 1))}`;
    })
    .join(" ");
}

