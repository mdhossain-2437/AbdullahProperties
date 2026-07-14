import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SITE_URL, company, verifiedServiceLines } from "@/lib/company-data";
import { absoluteUrl } from "@/lib/seo";

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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ScrollProgress />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: company.name,
                alternateName: company.nameBn,
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: absoluteUrl("/icon.png"),
                  width: 512,
                  height: 512,
                },
                email: company.email,
                telephone: company.phones[0].e164,
                slogan: company.slogan,
              },
              {
                "@type": "RealEstateAgent",
                "@id": `${SITE_URL}/#business`,
                name: company.name,
                alternateName: company.nameBn,
                url: SITE_URL,
                description: company.description,
                email: company.email,
                telephone: company.phones[0].e164,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: `${company.address.line1}, ${company.address.line2}`,
                  addressLocality: company.address.locality,
                  addressRegion: company.address.region,
                  addressCountry: company.address.countryCode,
                },
                areaServed: {
                  "@type": "City",
                  name: company.address.locality,
                },
                openingHoursSpecification: company.hours.days.map((day) => ({
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: day,
                  opens: company.hours.opens,
                  closes: company.hours.closes,
                })),
                hasOfferCatalog: {
                  "@type": "OfferCatalog",
                  name: "Housing and real estate services",
                  itemListElement: verifiedServiceLines.map((service) => ({
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: service.title,
                      description: service.summary,
                    },
                  })),
                },
              },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: company.name,
                alternateName: company.nameBn,
                description: company.description,
                inLanguage: "en-BD",
                publisher: { "@id": `${SITE_URL}/#organization` },
              },
            ],
          }}
        />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
