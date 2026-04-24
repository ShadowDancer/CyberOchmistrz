import { Recipie } from "../types";
import { isRecipieVegan, isRecipieVegetarian } from "./recipieData";

export const DIET_TAGS = ["omnivore", "vegetarian", "vegan"] as const;
export type DietTagId = (typeof DIET_TAGS)[number];

export interface DietTag {
  id: DietTagId;
  labelPl: string;
  shortPl: string;
  satisfies: (recipe: Recipie) => boolean;
  /** Tags in the same exclusiveGroup cannot coexist on a single CrewMember. */
  exclusiveGroup?: string;
  /** If true, this tag is assigned to new crew members by default. */
  isDefault?: boolean;
}

export const DIET_REGISTRY: Record<DietTagId, DietTag> = {
  omnivore: {
    id: "omnivore",
    labelPl: "wszystkożerna",
    shortPl: "Omni.",
    satisfies: () => true,
    exclusiveGroup: "diet",
    isDefault: true,
  },
  vegetarian: {
    id: "vegetarian",
    labelPl: "wegetariańska",
    shortPl: "Weget.",
    satisfies: isRecipieVegetarian,
    exclusiveGroup: "diet",
  },
  vegan: {
    id: "vegan",
    labelPl: "wegańska",
    shortPl: "Wegan.",
    satisfies: isRecipieVegan,
    exclusiveGroup: "diet",
  },
};
