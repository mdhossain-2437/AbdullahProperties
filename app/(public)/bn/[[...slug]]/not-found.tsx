import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BengaliNotFound() {
  return (
    <main className="state-page" lang="bn-BD">
      <div className="state-card">
        <span className="eyebrow">বাংলা সংস্করণ</span>
        <h1>এই পাতাটি এখনো প্রকাশিত হয়নি।</h1>
        <p>ঠিকানাটি পরীক্ষা করুন, অথবা বাংলা হোমপেজ থেকে প্রয়োজনীয় বিষয়টি বেছে নিন।</p>
        <Link className="brand-button" href="/bn">
          বাংলা হোমে ফিরুন <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}

