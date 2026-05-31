export interface CrewMember {
  id: string;
  name: string; // can be empty string
  diet: Diet;
  excludedSupplies?: readonly string[];
}

export type Diet = "omnivore" | "vegetarian" | "vegan";

interface DietMetadata {
  labelShort: string;
  labelLong: string;
}

export const DIET_REGISTRY: Record<Diet, DietMetadata> = {
  omnivore:    { labelShort: "wszystkoż.", labelLong: "wszystkożerna" },
  vegetarian:  { labelShort: "weget.",     labelLong: "wegetariańska" },
  vegan:       { labelShort: "weg.",       labelLong: "wegańska" },
};
