import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LocalizedSkipLink } from "@/components/layout/localized-skip-link";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, company, verifiedServiceLines } from "@/lib/company-data";
import { absoluteUrl } from "@/lib/seo";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
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
                url: absoluteUrl("/pwa-512.png"),
                width: 512,
                height: 512,
              },
              email: company.email,
              telephone: company.phones[0].e164,
              slogan: company.slogan,
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                telephone: company.phones[0].e164,
                email: company.email,
                areaServed: company.address.countryCode,
                availableLanguage: ["English", "Bengali"],
              },
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
              image: absoluteUrl("/og/home.jpg"),
              logo: absoluteUrl("/pwa-512.png"),
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
              inLanguage: ["en-BD", "bn-BD"],
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }}
      />
      <LocalizedSkipLink />
      <SiteHeader />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
