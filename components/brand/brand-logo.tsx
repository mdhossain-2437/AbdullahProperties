import Link from "next/link";
import { AppImage as Image } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  tone?: "light" | "dark";
  className?: string;
  preload?: boolean;
};

export function BrandLogo({ tone = "light", className, preload = false }: BrandLogoProps) {
  const isDark = tone === "dark";

  return (
    <Link className={cn("brand-logo", `brand-logo--${tone}`, className)} href="/" aria-label="Abdullah Properties home">
      <Image
        className="brand-logo__image"
        src={isDark ? "/brand/logo-dark.png" : "/brand/logo-primary.png"}
        alt="Abdullah Properties"
        width={isDark ? 944 : 942}
        height={isDark ? 317 : 316}
        preload={preload}
      />
    </Link>
  );
}
