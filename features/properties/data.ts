export type PropertyKind = "Residential" | "Commercial" | "Mixed-use" | "Experience";

export type PropertyRecord = {
  slug: string;
  title: string;
  location: string;
  kind: PropertyKind;
  status: string;
  image: string;
  imageAlt: string;
  summary: string;
  overview: string;
  highlights: readonly string[];
  services: readonly string[];
};

export const properties: readonly PropertyRecord[] = [
  {
    slug: "joypurhat-residence",
    title: "Joypurhat Residence",
    location: "Main Road, Joypurhat",
    kind: "Residential",
    status: "Design showcase",
    image: "/properties/joypurhat-residence.jpg",
    imageAlt: "Contemporary concrete and glass residential entrance",
    summary: "A calm urban arrival shaped around light, durable materials, and everyday clarity.",
    overview:
      "This visual study demonstrates Abdullah Properties' approach to a modern residential experience: a legible entrance, considered landscape, durable finishes, and a strong sense of address.",
    highlights: ["Clear resident arrival", "Durable material palette", "Landscape-integrated frontage"],
    services: ["Development advisory", "Design coordination", "Delivery planning"],
  },
  {
    slug: "city-edge-workplace",
    title: "City Edge Workplace",
    location: "Sadar, Joypurhat",
    kind: "Commercial",
    status: "Vision concept",
    image: "/properties/night-district.jpg",
    imageAlt: "Illuminated contemporary office tower at night",
    summary: "A visible commercial landmark designed to stay legible from street scale to skyline.",
    overview:
      "The concept explores how a commercial property can pair brand presence with functional planning, flexible workplace floors, and an active evening identity.",
    highlights: ["High-visibility identity", "Flexible workplace planning", "After-dark presence"],
    services: ["Commercial strategy", "Brand integration", "Property management planning"],
  },
  {
    slug: "housing-base-development",
    title: "Housing Base Development",
    location: "Joypurhat",
    kind: "Mixed-use",
    status: "Delivery study",
    image: "/projects/housing-base-construction.jpg",
    imageAlt: "Large mixed-use building under construction",
    summary: "A delivery-led study connecting programme, construction visibility, and stakeholder confidence.",
    overview:
      "This project image represents the brand's Housing Base Total Solutions promise: decisions remain connected from early planning through delivery and handover.",
    highlights: ["Single delivery narrative", "Visible project communication", "Handover-focused planning"],
    services: ["Site evaluation", "Development roadmap", "Construction coordination"],
  },
  {
    slug: "client-experience-studio",
    title: "Client Experience Studio",
    location: "Joypurhat",
    kind: "Experience",
    status: "Brand environment",
    image: "/projects/client-studio.jpg",
    imageAlt: "Premium dark timber real estate reception area",
    summary: "A focused consultation environment where complex property decisions become easier to navigate.",
    overview:
      "The studio concept turns the brand's sturdy, visionary, and direct character into a calm place for reviewing options, documentation, and project decisions.",
    highlights: ["Private consultation setting", "Material-led brand experience", "Clear decision environment"],
    services: ["Property consultation", "Portfolio review", "Client experience design"],
  },
] as const;

export const featuredProperties = properties.slice(0, 3);

export function getProperty(slug: string) {
  return properties.find((property) => property.slug === slug);
}

export function filterProperties(query: string, kind: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return properties.filter((property) => {
    const matchesKind = kind === "All" || property.kind === kind;
    const searchable = `${property.title} ${property.location} ${property.kind}`.toLocaleLowerCase();
    const matchesQuery = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
    return matchesKind && matchesQuery;
  });
}
