import type { Metadata, Viewport } from "next";
import { Anybody, Work_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Abdullah Properties — Housing Base Total Solutions",
    template: "%s | Abdullah Properties",
  },
  description:
    "A clearer way to discover property, development guidance, and Housing Base Total Solutions in Joypurhat.",
  applicationName: "Abdullah Properties",
  keywords: ["Abdullah Properties", "Joypurhat real estate", "property development", "Bangladesh property"],
  icons: {
    icon: "/brand/app-icon.png",
    shortcut: "/brand/app-icon.png",
  },
  openGraph: {
    title: "Abdullah Properties",
    description: "Sturdy, visionary, direct property guidance in Joypurhat.",
    type: "website",
    locale: "en_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abdullah Properties",
    description: "Housing Base Total Solutions in Joypurhat.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf9f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${anybody.variable} ${workSans.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
