import Link from "next/link";
import { AppImage as Image } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  tone?: "light" | "dark";
  className?: string;
};

export function BrandLogo({ tone = "light", className }: BrandLogoProps) {
  return (
    <Link className={cn("brand-logo", `brand-logo--${tone}`, className)} href="/" aria-label="Abdullah Properties home">
      <Image
        className="brand-logo__image"
        src={tone === "dark" ? "/brand/logo-dark.png" : "/brand/logo-primary.png"}
        alt="Abdullah Properties"
        width={1024}
        height={1024}
        priority
      />
    </Link>
  );
}
