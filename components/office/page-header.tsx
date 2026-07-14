import type { ReactNode } from "react";

type OfficePageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
};

export function OfficePageHeader({ eyebrow, title, description, action, meta }: OfficePageHeaderProps) {
  return (
    <header className="office-page-header">
      <div><span className="office-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      <div className="office-page-header__aside">{meta}{action}</div>
    </header>
  );
}

