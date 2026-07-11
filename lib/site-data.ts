export const siteNavigation = [
  { href: "/properties", label: "Properties" },
  { href: "/projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

export const services = [
  {
    id: "01",
    icon: "building",
    title: "Property sales & leasing",
    summary:
      "A clear, locally informed route from first conversation to the right residential or commercial opportunity.",
  },
  {
    id: "02",
    icon: "landmark",
    title: "Development advisory",
    summary:
      "Site evaluation, positioning, feasibility thinking, and a practical roadmap before capital is committed.",
  },
  {
    id: "03",
    icon: "ruler",
    title: "Design & delivery",
    summary:
      "One accountable team connecting the brief, the built environment, and the details that protect long-term value.",
  },
  {
    id: "04",
    icon: "key",
    title: "Property management",
    summary:
      "Ongoing guidance for occupied assets, tenant experience, maintenance priorities, and operational clarity.",
  },
] as const;

export const proofPoints = [
  { value: "JOY", label: "Joypurhat-first market focus" },
  { value: "360°", label: "Property guidance, end to end" },
  { value: "01", label: "One accountable relationship" },
] as const;

export const areas = [
  {
    name: "Joypurhat Sadar",
    note: "Connected urban living, workplace access, and established daily services.",
    index: "24.59°N",
  },
  {
    name: "Main Road corridor",
    note: "High-visibility commercial potential shaped by access and passing movement.",
    index: "CITY / 01",
  },
  {
    name: "Panchbibi",
    note: "A growing local context for measured residential and mixed-use opportunity.",
    index: "NORTH / 02",
  },
] as const;

export type Insight = {
  slug: string;
  category: string;
  title: string;
  dek: string;
  readTime: string;
  sections: ReadonlyArray<{ heading: string; body: string }>;
};

export const insights: readonly Insight[] = [
  {
    slug: "evaluate-land-with-clarity",
    category: "Land & due diligence",
    title: "How to evaluate land with more clarity",
    dek: "A practical starting framework for access, documentation, context, and long-term usability.",
    readTime: "5 min read",
    sections: [
      {
        heading: "Start with the intended use",
        body: "A site is not good or bad in isolation. Its value depends on the building type, access pattern, users, servicing requirements, and time horizon it must support.",
      },
      {
        heading: "Verify before you visualize",
        body: "Ownership records, boundaries, access rights, utilities, local controls, and physical conditions should be checked before concept design or pricing assumptions become commitments.",
      },
      {
        heading: "Model the whole lifecycle",
        body: "Acquisition is only the first cost. Test construction access, maintenance, operations, tenant or resident needs, and exit flexibility as part of one decision.",
      },
    ],
  },
  {
    slug: "plot-to-handover",
    category: "Development process",
    title: "From plot to handover: one connected journey",
    dek: "Why clear decision gates reduce uncertainty across planning, design, delivery, and occupancy.",
    readTime: "6 min read",
    sections: [
      {
        heading: "Frame the brief",
        body: "Define users, outcomes, financial boundaries, programme constraints, and non-negotiable quality criteria before the solution takes shape.",
      },
      {
        heading: "Use visible decision gates",
        body: "Every phase should end with evidence: verified information, an agreed scope, cost and risk updates, and a clear owner for the next decision.",
      },
      {
        heading: "Plan the transition to use",
        body: "Handover includes documentation, training, maintenance priorities, defect resolution, and a clear operating rhythm—not only the keys.",
      },
    ],
  },
  {
    slug: "commercial-location-fit",
    category: "Commercial property",
    title: "What makes a commercial location fit",
    dek: "Look beyond visibility to customer movement, servicing, flexibility, and the economics of daily operation.",
    readTime: "4 min read",
    sections: [
      {
        heading: "Match movement to the business",
        body: "Footfall, vehicle access, public transport, parking, loading, and peak-hour behavior matter differently for retail, office, hospitality, and service uses.",
      },
      {
        heading: "Protect adaptability",
        body: "Efficient structural grids, service routes, access control, signage zones, and subdivisibility help a space remain useful as occupier needs change.",
      },
      {
        heading: "Test operating cost",
        body: "Rent or purchase price is only one input. Energy, maintenance, staffing, security, delivery access, and fit-out requirements shape the real commercial decision.",
      },
    ],
  },
] as const;

export function getInsight(slug: string) {
  return insights.find((insight) => insight.slug === slug);
}
