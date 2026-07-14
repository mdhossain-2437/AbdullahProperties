const DHAKA_TIME_ZONE = "Asia/Dhaka";

const moneyFormatters = new Map<string, Intl.NumberFormat>();

function getMoneyFormatter(currency: string) {
  const normalized = currency.trim().toUpperCase();
  const existing = moneyFormatters.get(normalized);
  if (existing) return existing;

  const formatter = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: normalized,
    currencyDisplay: normalized === "BDT" ? "narrowSymbol" : "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  moneyFormatters.set(normalized, formatter);
  return formatter;
}

export function formatOfficeMoney(minorUnits: number, currency = "BDT") {
  if (!Number.isSafeInteger(minorUnits)) throw new RangeError("Money must use safe integer minor units.");
  return getMoneyFormatter(currency).format(minorUnits / 100);
}

export function formatOfficeDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+06:00`) : new Date(value);
  if (Number.isNaN(date.valueOf())) return "Invalid date";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DHAKA_TIME_ZONE,
  }).format(date);
}

export function formatOfficeDateTime(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Invalid date";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: DHAKA_TIME_ZONE,
    timeZoneName: "short",
  }).format(date);
}

export function formatOfficePercent(basisPoints: number) {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new RangeError("Percentage must be expressed as basis points between 0 and 10000.");
  }
  return `${(basisPoints / 100).toLocaleString("en-BD", { maximumFractionDigits: 2 })}%`;
}

export function humanizeOfficeValue(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getOfficeLocalDate(value = new Date()) {
  if (Number.isNaN(value.valueOf())) throw new TypeError("A valid date is required.");
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: DHAKA_TIME_ZONE,
  }).formatToParts(value);
  const part = (type: "year" | "month" | "day") => parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) throw new TypeError("The local office date could not be formatted.");
  return `${year}-${month}-${day}`;
}

export function addOfficeLocalDays(localDate: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !Number.isInteger(days)) throw new TypeError("A local ISO date and whole day offset are required.");
  const date = new Date(`${localDate}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new TypeError("A valid local date is required.");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
