import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SITE_URL, company } from "@/lib/company-data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Abdullah Properties | Real Estate & Joint Venture Housing in Joypurhat",
    template: "%s | Abdullah Properties",
  },
  description: company.description,
  applicationName: company.name,
  authors: [{ name: company.name }],
  creator: company.name,
  publisher: company.name,
  category: "Real estate",
  keywords: [company.name, company.nameBn, "Joypurhat real estate", "joint venture housing", "land documentation support"],
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/pwa-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Abdullah Properties | Joypurhat Real Estate & Housing Solutions",
    description: company.description,
    type: "website",
    locale: "en_BD",
    siteName: company.name,
    url: "/",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "Abdullah Properties in Joypurhat" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Abdullah Properties | Joypurhat Real Estate & Housing Solutions",
    description: company.description,
    images: ["/og/home.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf9f8",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-abdullah-public-locale") === "bn-BD" ? "bn-BD" : "en-BD";

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
