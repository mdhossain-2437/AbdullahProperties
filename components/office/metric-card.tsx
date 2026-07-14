import type { LucideIcon } from "lucide-react";

type OfficeMetricCardProps = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "warning" | "positive";
};

export function OfficeMetricCard({ label, value, note, icon: Icon, tone = "default" }: OfficeMetricCardProps) {
  return (
    <article className="office-metric" data-tone={tone}>
      <div><span>{label}</span><Icon aria-hidden="true" /></div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}
