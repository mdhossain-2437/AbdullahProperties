import type { Metadata } from "next";
import studioCss from "./studio.css?raw";

export const metadata: Metadata = {
  title: { absolute: "Content Studio | Abdullah Properties" },
  description: "Protected editorial content operations for Abdullah Properties.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="studio-surface"><style>{studioCss}</style>{children}</div>;
}
