import type { ReactNode } from "react";
import bengaliPublicCss from "./bn-public.css?raw";

type BengaliPublicLayoutProps = {
  readonly children: ReactNode;
};

export default function BengaliPublicLayout({ children }: BengaliPublicLayoutProps) {
  return <><style>{bengaliPublicCss}</style>{children}</>;
}
