# Abdullah Properties

A branded, multi-route real-estate experience for Abdullah Properties and its “Housing Base Total Solutions” positioning in Joypurhat, Bangladesh.

The current release is a private product preview. Property imagery is presented as visual studies, availability must be confirmed directly, and the enquiry flow validates locally without transmitting personal information. Search indexing remains disabled until approved contact delivery, privacy language, canonical domain, and live inventory are configured.

## Product routes

- `/` — reference-inspired landing page
- `/properties` and `/properties/[slug]` — searchable visual studies and detail views
- `/projects` — development and brand-environment work
- `/services` — connected property disciplines
- `/about` — positioning, values, and local context
- `/insights` and `/insights/[slug]` — editorial guidance
- `/contact` — validated, non-transmitting consultation preview

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 and shadcn/Radix primitives
- Framer Motion with reduced-motion support and visible server-rendered content
- React Hook Form and Zod validation
- vinext/Cloudflare Workers output for OpenAI Sites

## Local development

Node.js `>=22.13.0` is required.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm audit --omit=dev
```

`npm test` creates the production vinext build and verifies the home page, primary routes, dynamic routes, preview safeguards, and production metadata through the built worker.

## Architecture and production boundary

The staged modular-monolith architecture, domain boundaries, security model, data evolution, caching triggers, observability, deployment, and future platform roadmap are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Before a public launch, configure and verify:

1. Approved business contact details and an enquiry delivery provider.
2. Consent text, privacy policy, retention policy, and operational ownership.
3. Verified live inventory and property claims.
4. The canonical domain, `metadataBase`, sitemap, and indexing policy.
5. Live security headers, monitoring, analytics consent, and recovery procedures.
