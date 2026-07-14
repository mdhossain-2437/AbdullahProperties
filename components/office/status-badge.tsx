import { cn } from "@/lib/utils";

export function OfficeStatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
  return <span className={cn("office-status", className)} data-status={normalized}>{status.replaceAll("_", " ")}</span>;
}

