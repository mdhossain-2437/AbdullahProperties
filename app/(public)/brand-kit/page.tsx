import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Download, ImageIcon, Palette, Type } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";
import { company, contentVerification } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Brand Kit",
  description:
    "Download the official Abdullah Properties logos, social templates, color references, and typography guidance.",
  path: "/brand-kit",
  image: "/og/home.jpg",
});

const logoAssets = [
  {
    name: "Primary logo",
    description: "Black and orange lockup for light, quiet backgrounds.",
    path: "/brand/logo-primary.png",
    alt: "Abdullah Properties primary black and orange logo on a transparent background",
    surface: "light",
    width: 942,
    height: 316,
  },
  {
    name: "Inverse logo",
    description: "White and orange lockup for black or very dark backgrounds.",
    path: "/brand/logo-dark.png",
    alt: "Abdullah Properties inverse white and orange logo on a transparent background",
    surface: "dark",
    width: 944,
    height: 317,
  },
  {
    name: "Primary mark",
    description: "Compact AP house mark for avatars, icons, and constrained spaces.",
    path: "/brand/logo-mark.png",
    alt: "Abdullah Properties black and orange AP house mark on a transparent background",
    surface: "light",
    width: 330,
    height: 308,
  },
  {
    name: "Inverse mark",
    description: "Compact white and orange AP house mark for dark surfaces.",
    path: "/brand/logo-mark-inverse.png",
    alt: "Abdullah Properties white and orange AP house mark on a transparent background",
    surface: "dark",
    width: 332,
    height: 309,
  },
] as const;

const brandColors = [
  { name: "Foundation black", hex: "#0C0C0C", role: "Primary type, dark fields, and structural contrast" },
  { name: "Housing orange", hex: "#FF6B2C", role: "Primary accent, actions, highlights, and the logo window" },
  { name: "Warm canvas", hex: "#FBF9F8", role: "Primary light background and breathing space" },
  { name: "Slate", hex: "#444748", role: "Secondary copy and supporting information" },
  { name: "Deep terracotta", hex: "#802900", role: "Accessible accent copy and restrained depth" },
  { name: "White", hex: "#FFFFFF", role: "Inverse type, clean surfaces, and logo contrast" },
] as const;

const socialAssets = [
  {
    name: "Square post",
    dimensions: "1080 × 1080 px",
    path: "/social/post-square.jpg",
    alt: "Square Abdullah Properties social media brand template",
    width: 1080,
    height: 1080,
  },
  {
    name: "Vertical story",
    dimensions: "1080 × 1920 px",
    path: "/social/story-vertical.jpg",
    alt: "Vertical Abdullah Properties social story brand template",
    width: 1080,
    height: 1920,
  },
  {
    name: "LinkedIn cover",
    dimensions: "1584 × 396 px",
    path: "/social/linkedin-cover.jpg",
    alt: "Wide Abdullah Properties LinkedIn cover brand template",
    width: 1584,
    height: 396,
  },
] as const;

export default function BrandKitPage() {
  return (
    <main className="brand-kit-page">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Brand kit", path: "/brand-kit" },
        ]}
      />

      <PageHero
        eyebrow="Official identity resources"
        index="08"
        title="One brand, used with care."
        description="Use these transparent logo assets, colors, type references, and social templates to keep Abdullah Properties recognisable across every touchpoint."
      />

      <section className="content-section brand-kit-page__logos" aria-labelledby="brand-logo-title">
        <div className="site-shell">
          <div className="section-heading-row brand-kit-page__heading">
            <div className="section-heading">
              <span className="eyebrow">Logo suite</span>
              <h2 id="brand-logo-title">Transparent assets for light and dark surfaces.</h2>
              <p>
                Keep the artwork proportional, clear of visual clutter, and large enough for every word to remain
                legible. Use the matching inverse version on dark backgrounds.
              </p>
            </div>
            <div className="brand-kit-page__actions">
              <Button asChild className="brand-button">
                <a href="/brand/abdullah-properties-brand-kit.zip" download>
                  Download complete kit <Download aria-hidden="true" />
                </a>
              </Button>
              <Button asChild className="brand-button brand-button--outline">
                <a href="/brand/BRAND-GUIDELINES.txt" download>
                  Usage guide <Download aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          <div className="brand-kit-logo-grid">
            {logoAssets.map((asset) => (
              <article className="brand-kit-logo-card" key={asset.path}>
                <div
                  className={`brand-kit-logo-card__preview brand-kit-logo-card__preview--${asset.surface}`}
                >
                  <Image
                    src={asset.path}
                    alt={asset.alt}
                    width={asset.width}
                    height={asset.height}
                    sizes="(max-width: 760px) 88vw, 42vw"
                  />
                </div>
                <div className="brand-kit-logo-card__body">
                  <div>
                    <h3>{asset.name}</h3>
                    <p>{asset.description}</p>
                  </div>
                  <a className="brand-kit-download-link" href={asset.path} download>
                    PNG <Download aria-hidden="true" />
                    <span className="sr-only">Download {asset.name}</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section content-section--tint brand-kit-page__foundations">
        <div className="site-shell brand-kit-foundation-grid">
          <article className="brand-kit-foundation-panel" aria-labelledby="brand-colors-title">
            <div className="brand-kit-foundation-panel__icon" aria-hidden="true">
              <Palette />
            </div>
            <span className="eyebrow">Color system</span>
            <h2 id="brand-colors-title">Warm, sturdy, direct.</h2>
            <div className="brand-color-list">
              {brandColors.map((color) => (
                <div className="brand-color-row" key={color.hex}>
                  <span
                    className="brand-color-row__swatch"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <div>
                    <h3>{color.name}</h3>
                    <p>{color.hex}</p>
                    <small>{color.role}</small>
                  </div>
                </div>
              ))}
            </div>
            <a className="brand-kit-text-link" href="/brand/brand-tokens.json" download>
              Download design tokens <Download aria-hidden="true" />
            </a>
          </article>

          <article className="brand-kit-foundation-panel" aria-labelledby="brand-type-title">
            <div className="brand-kit-foundation-panel__icon" aria-hidden="true">
              <Type />
            </div>
            <span className="eyebrow">Typography</span>
            <h2 id="brand-type-title">Anybody meets Work Sans.</h2>
            <div className="brand-type-sample brand-type-sample--display">
              <span>Display / Anybody</span>
              <p>Housing base.</p>
              <small>Use for expressive headings, concise statements, and navigational emphasis.</small>
            </div>
            <div className="brand-type-sample brand-type-sample--body">
              <span>Body / Work Sans</span>
              <p>Clear information helps people make considered property decisions.</p>
              <small>Use for body copy, labels, forms, captions, and operational information.</small>
            </div>
            <p className="brand-kit-foundation-panel__note">
              Do not introduce a third typeface. Preserve readable line lengths, sentence case in body copy, and
              deliberate spacing around display type.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section brand-kit-page__social" aria-labelledby="brand-social-title">
        <div className="site-shell">
          <div className="section-heading-row brand-kit-page__heading">
            <div className="section-heading">
              <span className="eyebrow">Social templates</span>
              <h2 id="brand-social-title">Starting points, not claim templates.</h2>
              <p>
                Replace sample messaging only with approved, verifiable information. Confirm property availability,
                specifications, pricing, approvals, and ownership before publishing.
              </p>
            </div>
            <ImageIcon aria-hidden="true" />
          </div>
          <div className="brand-social-grid">
            {socialAssets.map((asset) => (
              <article className="brand-social-card" key={asset.path}>
                <div className="brand-social-card__preview">
                  <Image
                    src={asset.path}
                    alt={asset.alt}
                    width={asset.width}
                    height={asset.height}
                    sizes="(max-width: 760px) 88vw, 30vw"
                  />
                </div>
                <div className="brand-social-card__body">
                  <div>
                    <h3>{asset.name}</h3>
                    <p>{asset.dimensions}</p>
                  </div>
                  <a className="brand-kit-download-link" href={asset.path} download>
                    JPG <Download aria-hidden="true" />
                    <span className="sr-only">Download {asset.name}</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section content-section--dark brand-kit-page__rules">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow eyebrow--light">Non-negotiables</span>
            <h2>Protect clarity before adding decoration.</h2>
            <p>
              These assets represent {company.name}. Keep the house mark intact, use the orange deliberately, and
              separate verified company information from illustrative design material.
            </p>
          </div>
          <ul className="editorial-list">
            {[
              "Keep the logo proportions unchanged and leave clear space around the complete mark.",
              "Use the primary logo on light surfaces and the inverse logo on dark surfaces.",
              "Never stretch, rotate, outline, recolor, crop, or place effects behind the logo.",
              "Do not publish rankings, ratings, project facts, prices, guarantees, or leadership identities without approved evidence.",
            ].map((rule, index) => (
              <li key={rule}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>
                    <Check aria-hidden="true" /> Use with care
                  </h3>
                  <p>{rule}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="detail-cta">
        <div className="site-shell detail-cta__inner">
          <div>
            <span className="eyebrow">Brand approval</span>
            <h2>Need a format that is not included?</h2>
            <p className="brand-kit-page__verification">
              Resource content reviewed {contentVerification.reviewedOn}. Request approval before producing a new
              public-facing variation.
            </p>
          </div>
          <Button asChild className="brand-button brand-button--light">
            <Link href="/contact">
              Contact Abdullah Properties <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
