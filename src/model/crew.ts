export interface CrewMember {
  readonly id: string;
  readonly name: string; // can be empty string
  readonly diet: Diet;
  readonly excludedSupplies?: readonly string[];
}

export type Diet = "omnivore" | "vegetarian" | "vegan";

interface DietMetadata {
  readonly labelShort: string;
  readonly labelLong: string;
}

export const DIET_REGISTRY: Record<Diet, DietMetadata> = {
  omnivore:    { labelShort: "wszystkoż.", labelLong: "wszystkożerna" },
  vegetarian:  { labelShort: "weget.",     labelLong: "wegetariańska" },
  vegan:       { labelShort: "weg.",       labelLong: "wegańska" },
};
