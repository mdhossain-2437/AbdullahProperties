import { Reveal } from "@/components/motion/reveal";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  index: string;
};

export function PageHero({ eyebrow, title, description, index }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="site-shell page-hero__grid">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </Reveal>
        <Reveal className="page-hero__aside" delay={0.08}>
          <span className="page-index">AP / {index}</span>
          <p>{description}</p>
        </Reveal>
      </div>
    </section>
  );
}
