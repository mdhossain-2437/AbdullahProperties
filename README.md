# Abdullah Properties

A branded, multi-route real-estate experience for Abdullah Properties and its “Housing Base Total Solutions” positioning in Joypurhat, Bangladesh.

The current release is a public, server-rendered company platform. Property imagery remains clearly labelled as visual studies unless a page identifies a verified project record. The enquiry planner validates and formats data locally, then lets the visitor explicitly open email or WhatsApp; it never transmits data by itself.

Technical indexing is enabled against the current Sites URL. A business-controlled custom domain, verified Google Business Profile, Search Console ownership, approved leadership material, and current project documents remain operational launch requirements.

## Product routes

- `/` — reference-inspired landing page
- `/properties` and `/properties/[slug]` — searchable visual studies and detail views
- `/projects` and `/projects/nirapad-nibas` — bounded project facts plus clearly separated visual studies
- `/services` — six published service lines and the five-step working process
- `/about` — company story, values, local context, and protected founder/co-founder profile slots
- `/insights` and `/insights/[slug]` — editorial guidance
- `/contact` — verified office details and locally prepared email/WhatsApp enquiry handoff
- `/faq` — visible operational answers with matching structured data
- `/brand-kit` — transparent logos, design tokens, social templates, and downloadable brand bundle
- `/privacy`, `/terms`, `/cookies`, `/property-disclaimer`, `/accessibility` — launch-supporting policy pages
- unmatched routes — animated, accessible, server-rendered 404 experience

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

`npm test` creates the production vinext build and verifies public routes, dynamic routes, redirects, SEO endpoints, canonical metadata, structured data safeguards, asset delivery, security headers, and 404 handling through the built worker.

## Architecture and production boundary

The staged modular-monolith architecture, domain boundaries, security model, data evolution, caching triggers, observability, deployment, and future platform roadmap are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Before a final custom-domain launch, configure and verify:

1. Business-controlled domain and permanent redirects from every alternate host.
2. Google Business Profile and Search Console ownership.
3. Owner-approved leadership names, biographies, titles, and original portraits.
4. Verified live inventory, project schedules, approvals, pricing, and property claims.
5. Bangladesh legal review of policies and transaction-specific documents.
6. Monitoring, analytics consent (if analytics is introduced), and recovery procedures.
