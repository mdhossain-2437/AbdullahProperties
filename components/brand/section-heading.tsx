import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  inverse?: boolean;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, inverse = false, className }: SectionHeadingProps) {
  return (
    <div className={cn("section-heading", inverse && "section-heading--inverse", className)}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
