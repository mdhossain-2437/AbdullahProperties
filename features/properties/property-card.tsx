import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppImage as Image } from "@/components/ui/app-image";
import type { PropertyRecord } from "@/features/properties/data";

type PropertyCardProps = {
  property: PropertyRecord;
  priority?: boolean;
};

export function PropertyCard({ property, priority = false }: PropertyCardProps) {
  return (
    <article className="property-card">
      <Link className="property-card__media" href={`/properties/${property.slug}`} aria-label={`View ${property.title}`}>
        <Image src={property.image} alt={property.imageAlt} fill sizes="(max-width: 760px) 100vw, 33vw" priority={priority} />
        <Badge className="property-card__status">{property.status}</Badge>
        <span className="property-card__arrow"><ArrowUpRight aria-hidden="true" /></span>
      </Link>
      <div className="property-card__body">
        <div>
          <span className="property-card__kind">{property.kind}</span>
          <h3><Link href={`/properties/${property.slug}`}>{property.title}</Link></h3>
        </div>
        <p><MapPin aria-hidden="true" /> {property.location}</p>
      </div>
    </article>
  );
}
