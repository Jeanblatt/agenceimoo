import PropertyCard from "@/components/PropertyCard";
import Button from "@/components/ui/Button";
import type { Property } from "@/data/properties";

interface PropertyGridProps {
  properties: Property[];
}

export default function PropertyGrid({ properties }: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-stone-500">
          Aucun bien ne correspond à votre recherche pour le moment.
        </p>
        <Button href="/biens" variant="ghost" className="mt-4">
          Réinitialiser la recherche
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property, index) => (
        <PropertyCard key={property.id} {...property} preload={index < 3} index={index} />
      ))}
    </div>
  );
}
