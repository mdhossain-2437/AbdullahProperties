export type ExploreNavigationLink = {
  href: string;
  label: string;
  description: string;
};

export type ExploreNavigationGroup = {
  id: string;
  label: string;
  links: readonly ExploreNavigationLink[];
};

export const exploreNavigationGroups = [
  {
    id: "01",
    label: "Discover",
    links: [
      { href: "/properties", label: "Properties", description: "Browse property and project studies." },
      { href: "/projects", label: "Projects", description: "Review project stories and published evidence." },
      { href: "/area-guides", label: "Areas", description: "Read location context before comparing options." },
    ],
  },
  {
    id: "02",
    label: "Decisions",
    links: [
      { href: "/solutions", label: "Solutions", description: "Choose the decision path that fits." },
      { href: "/buyers", label: "Buyers", description: "Prepare viewing and verification questions." },
      { href: "/landowners", label: "Landowners", description: "Frame the first land conversation." },
      { href: "/joint-venture", label: "Joint venture", description: "Review evidence, scope, and responsibility." },
      { href: "/property-planner", label: "Planner", description: "Prepare a local, unsent decision summary." },
    ],
  },
  {
    id: "03",
    label: "Delivery",
    links: [
      { href: "/services", label: "Services", description: "See the connected service lines." },
      { href: "/process", label: "Process", description: "Follow the published working sequence." },
      { href: "/quality", label: "Quality", description: "Understand the review and evidence gates." },
      { href: "/client-care", label: "Client care", description: "Prepare handover and after-sales records." },
    ],
  },
  {
    id: "04",
    label: "Company",
    links: [
      { href: "/about", label: "About", description: "Read the company context and principles." },
      { href: "/insights", label: "Insights", description: "Use practical property decision guides." },
      { href: "/resources", label: "Resources", description: "Open checklists and preparation tools." },
      { href: "/contact", label: "Contact", description: "Choose a direct conversation channel." },
      { href: "/brand-kit", label: "Brand kit", description: "Review Abdullah Properties brand assets." },
    ],
  },
] as const satisfies readonly ExploreNavigationGroup[];

export const protectedNavigationLinks = [
  { href: "/office", label: "Office", description: "Protected operations workspace." },
  { href: "/studio", label: "Studio", description: "Protected content workspace." },
] as const satisfies readonly ExploreNavigationLink[];

export function isPathCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

