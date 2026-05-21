import { CrewMember } from './crew';
import { Recipie, MealType } from './recipe';

export interface Cruise {
  id: string;
  name: string;
  dateCreated: string;
  dateModified: string;
  length: number; // in days
  crewMembers: CrewMember[];
  days: CruiseDay[];
  additionalSupplies?: CruiseSupply[];
  startDate?: string; // YYYY-MM-DD format
}

export interface CruiseDay {
  dayNumber: number;
  recipes: CruiseDayRecipe[];
}

export interface CruiseSupply {
  id: string;
  amount: number;
  isPerPerson: boolean;
  isPerDay: boolean;
}

export interface CruiseDayRecipe {
  originalRecipeId: string;
  recipeData: Recipie; // required: snapshot taken at add-time
  crewCount: number;
  mealSlot: MealType;
}
