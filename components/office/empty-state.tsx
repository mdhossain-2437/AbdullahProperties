import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type OfficeEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function OfficeEmptyState({ icon: Icon, title, description, action }: OfficeEmptyStateProps) {
  return (
    <div className="office-empty">
      <Icon aria-hidden="true" />
      <span className="office-eyebrow">Ready for the first record</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

