export interface CrewMember {
  id: string;
  name: string; // can be empty string
  diet: Diet
}

type Diet = "omnivore" | "vegetarian" | "vegan";

interface DietMetadata {
  labelShort: string,
  lableLong: string
}

const DIET_REGISTRY: Record<Diet, DietMetadata> = {
  omnivore: {
    labelShort: "wszystkoż.",
    lableLong: "wszystkożerna"
  },
  vegetarian: {
    labelShort: "weget.",
    lableLong: "wegetariańska"
  },
  vegan: {
    labelShort: "weg.",
    lableLong: "wegańska"
  }
}
