"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterProperties, type PropertyKind } from "@/features/properties/data";
import { PropertyCard } from "@/features/properties/property-card";

const kinds: readonly ("All" | PropertyKind)[] = ["All", "Residential", "Commercial", "Mixed-use", "Experience"];

type PropertyExplorerProps = {
  initialQuery?: string;
  initialKind?: (typeof kinds)[number];
};

export function PropertyExplorer({ initialQuery = "", initialKind = "All" }: PropertyExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<(typeof kinds)[number]>(initialKind);
  const matches = useMemo(() => filterProperties(query, kind), [query, kind]);

  function resetFilters() {
    setQuery("");
    setKind("All");
  }

  return (
    <div className="property-explorer">
      <div className="property-toolbar" role="group" aria-label="Property filters">
        <label className="property-search">
          <span className="sr-only">Search properties</span>
          <Search aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by project, place, or type" />
        </label>
        <div className="filter-chips" role="group" aria-label="Filter by property type">
          {kinds.map((item) => (
            <Button key={item} type="button" variant={kind === item ? "default" : "outline"} onClick={() => setKind(item)} aria-pressed={kind === item}>
              {item}
            </Button>
          ))}
        </div>
      </div>
      <div className="result-summary" aria-live="polite">
        <span>{matches.length.toString().padStart(2, "0")} visual studies</span>
        <span>Availability must be confirmed directly</span>
      </div>
      {matches.length > 0 ? (
        <div className="property-grid">
          {matches.map((property, index) => <PropertyCard key={property.slug} property={property} preload={index < 2} />)}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <span className="empty-state__mark">0</span>
          <h2>No visual studies match that search.</h2>
          <p>Reset the filters or start a direct conversation about the property need you have in mind.</p>
          <Button className="brand-button" type="button" onClick={resetFilters}><X aria-hidden="true" /> Reset filters</Button>
        </div>
      )}
    </div>
  );
}
