import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="state-page">
      <div className="state-page__inner"><span className="state-page__code">404</span><h1>This address is not in the plan.</h1><p>The page may have moved, or the property reference is not part of the current portfolio.</p><Button asChild className="brand-button"><Link href="/"><ArrowLeft aria-hidden="true" /> Return home</Link></Button></div>
    </main>
  );
}
