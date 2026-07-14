import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type JourneyCardProps = {
  item: {
    id: string;
    label: string;
    title: string;
    summary: string;
    href: string;
    action: string;
  };
};

export function JourneyCard({ item }: JourneyCardProps) {
  return (
    <article className="journey-card">
      <div className="journey-card__meta">
        <span>{item.id}</span>
        <span>{item.label}</span>
      </div>
      <div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
      </div>
      <Link href={item.href} aria-label={`${item.action}: ${item.title}`}>
        {item.action}
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </article>
  );
}
