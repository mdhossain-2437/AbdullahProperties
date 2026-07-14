# Abdullah Properties Reference Design Synthesis

Status: accepted  
Source library: `D:\webflow-sites`  
Audit scope: 101 captured projects, 17,935 files, approximately 3.14 GB

## Direction

The new experience combines five reference strengths without copying any one site:

1. **Future Three** — cinematic editorial hierarchy, oversized typography, asymmetric information, and project-led storytelling.
2. **Osmo** — accessible interaction mechanics, fixed-underlay navigation, motion teardown discipline, scroll progress, stacking cards, filters, modals, and dashboard patterns.
3. **MERSI + Eppright Homes** — architecture/process storytelling expressed as understandable client milestones.
4. **Dwellis + Terris** — property-detail, neighborhood, gallery, floor-plan, and discovery information architecture.
5. **Streamtime** — connected office operations across projects, tasks, schedules, quotations, invoices, collaboration, and reports.

Abdullah Properties remains visually distinct through its existing Anybody/Work Sans typography, safety-orange accent, black/peach neutrals, framed AP logo geometry, Joypurhat context, and evidence-led language.

## Public experience patterns

| Pattern | Reference evidence | Abdullah implementation |
|---|---|---|
| Fixed underlay explore menu | `D:\webflow-sites\osmo-fixed-underlay-nav.webflow.io\index.html` | A keyboard-safe full navigation layer grouping Explore, Services, Company, Resources, and Office. Escape closes, focus returns, reduced motion is respected. |
| Cinematic project hero | `D:\webflow-sites\www.futurethree.studio\index.html` | Location/status metadata, one dominant visual, one primary enquiry, oversized property language. |
| Word-led sticky narrative | `D:\webflow-sites\storytelling.plank.co\scripts\script.js` | A restrained “How Abdullah works” sequence; short claims reveal only when they improve pacing. |
| Client-readable process | `D:\webflow-sites\www.mersi-architecture.com\process.html`; `D:\webflow-sites\www.epprighthomes.com\our-process.html` | Deliverables, responsibility, evidence, decision gate, and expected next step per phase. |
| Property detail anatomy | `D:\webflow-sites\halo-lab\dwellis-property-portfolios.webflow.io\property\parkview-luxury-condo.html` | Description, location, gallery, facts, current verification state, documents, progress, and enquiry. |
| Neighborhood story | `D:\webflow-sites\halo-lab\terris-property-showcase-template.webflow.io\neighbourhood.html` | Area guides for daily movement, services, landmarks, decision questions, and available opportunities. |
| Stacking proof cards | `D:\webflow-sites\www.osmo.supply\resource\stacking-sticky-cards-bounce.html` | Project stages, quality principles, and evidence records. Motion uses transform/opacity only. |
| Before/after comparison | `D:\webflow-sites\www.osmo.supply\resource\before-after-split-slider.html` | Reserved for verified renovation or construction-progress pairs; never simulated as a real project claim. |
| Accessible filter/modal semantics | `D:\webflow-sites\www.osmo.supply\resource\basic-filter-setup.html`; `basic-modal-setup.html`; `multilevel-navigation.html` | Mandatory keyboard, focus, `aria-expanded`, `aria-controls`, live results, and escape behavior. |

## Office experience patterns

| Pattern | Reference evidence | Abdullah implementation |
|---|---|---|
| Operational shell | `D:\webflow-sites\www.osmo.supply\vault.html` | Collapsible navigation, active location, global search seam, recent work, empty states, and update center. |
| Guided onboarding | `D:\webflow-sites\www.osmo.supply\onboarding.html` | Organization, team, roles, invoice defaults, workflow, and numbering setup—only after the initial owner can enter. |
| Connected project control | `D:\webflow-sites\streamtime.net\features\project-planning.html`; `kanban.html`; `collaboration.html` | One project record links milestones, tasks, people, documents, cost, invoices, and decisions. |
| Quote-to-invoice continuity | `D:\webflow-sites\streamtime.net\features\quoting-and-invoicing.html` | Draft commercial document, approval, sequence, posting, collection, receipt, and audit trail. |
| Portfolio reporting | `D:\webflow-sites\www.fluency.inc\platform\reporting.html`; `budget-management.html` | Pipeline, receivables, project health, overdue work, expenses, and approval exceptions. |

## New public route map

- `/solutions` — routes for buyers, landowners, project clients, and after-sales needs.
- `/joint-venture` — the evidence, responsibility, negotiation, agreement, and delivery system.
- `/quality` — review gates across brief, land, design, delivery, inspection, and handover.
- `/client-care` — handover records, issue routing, response expectations, and maintenance readiness.
- `/resources` — practical checklists and decision tools.
- `/property-planner` — an accessible local decision planner that prepares an enquiry without silently sending data.
- `/areas` — canonical alias and expanded discovery path for current area guides.
- Existing property, project, service, process, buyer, landowner, insight, and area-detail routes gain stronger cross-navigation.

Routes are only indexed when they contain useful, non-duplicative content. Pages do not invent inventory, ratings, timelines, leadership identities, regulatory approval, or investment returns.

## Motion system

- Entrances: 400–650 ms, ease-out, opacity/transform only.
- Micro-interactions: 150–250 ms.
- Stacking/pinning: CSS sticky first; Framer Motion only for readable progress and image reveal.
- Marquee: pauses on interaction and becomes static under reduced motion.
- Route changes: native Next.js navigation; no Swup/Lenis copy. Client effects are leaf-level and automatically unmount.
- Office motion: limited to menu, feedback, and view-state transitions; no scroll theatre.
- Every effect is optional under `prefers-reduced-motion` and leaves content visible before hydration.

## Visual hierarchy

- Primary palette: ink `#0C0C0C`, housing orange `#FF6B2C`, warm paper `#FBF9F8`.
- Supporting neutrals: slate and warm border only; no competing accent color.
- Display: Anybody, high-impact but capped at readable line lengths.
- Interface/body: Work Sans.
- One primary action per screen or section.
- Photography is used as evidence/context. Illustrative brand studies remain explicitly labelled.

## Performance and accessibility constraints

- Public Server Components remain the default; motion and planner features are small client islands.
- Below-fold images lazy-load with explicit geometry.
- No copied Webflow runtime, GSAP bundle, Lenis, Swup, or source-map/vendor code is shipped.
- Focus is visible, all controls have keyboard paths, and dynamic result counts use live regions when needed.
- Fixed/sticky elements never trap mobile content or create horizontal overflow at 320 px.
- New client JavaScript and CSS remain inside the repository performance budgets.

## Definition of done

- Reference patterns are recomposed into Abdullah-specific workflows and copy.
- Public routes have metadata, canonical URLs, structured navigation, and sitemap coverage.
- Office routes use a dedicated private/no-store/noindex shell.
- Motion honors reduced motion and has no hydration-dependent hidden content.
- Every new interactive feature includes empty, error, success, keyboard, and mobile behavior.
- Builds, lint, type checks, automated route tests, accessibility checks, and real browser verification pass.
