export interface Supply {
  id: string;
  name: string;
  unit: string;
  description?: string;
  isIngredient: boolean;
  category: string;
  defaultAmount?: number;
}

export interface Ingredient extends Supply {
  category: 'nabiał' | 'mięso' | 'warzywa' | 'owoce' | 'pieczywo' | 'zboża' | 'przyprawy' | 'tłuszcze' | 'napoje' | 'środki czystości' | 'inne';
  isVegetarian: boolean;
  isVegan: boolean;
}

export interface IngredientAmount {
  id: string;
  amount: number;
}

export enum MealType {
  BREAKFAST = 'śniadanie',
  DINNER = 'obiad',
  SUPPER = 'kolacja',
  SNACK = 'przekąska'
}

export interface Recipie {
  id: string;
  name: string;
  ingredients: IngredientAmount[];
  description: string;
  mealType: MealType[];
  difficulty: number; // 1-5 stars
  instructions: string[]; // array of preparation steps
  developedBy?: string; // Author of the recipe
  modifiedBy?: string[]; // Array of people who modified the recipe
}

export interface CruiseSupply {
  id: string;
  amount: number;
  isPerPerson: boolean;
  isPerDay: boolean;
}

export interface CrewMember {
  id: string;
  name?: string; // omitted = anonymous; no validation beyond that
  tags: string[]; // string[] not DietTag[] so unknown tags round-trip safely
}

export interface CruiseDayRecipe {
  originalRecipeId: string;
  recipeData: Recipie; // required: snapshot taken at add-time
  crewCount: number;
  mealSlot: MealType;
}

export interface CruiseDay {
  dayNumber: number;
  recipes: CruiseDayRecipe[];
}

export class RecipeAmountSource {
  readonly type = 'recipe' as const;
  amount: number; // base amount before crew scaling
  recipeName?: string;
  dayNumber?: number;
  crewCount: number;

  constructor(amount: number, recipeName?: string, dayNumber?: number, crewCount: number = 1) {
    this.amount = amount;
    this.recipeName = recipeName;
    this.dayNumber = dayNumber;
    this.crewCount = crewCount;
  }
}

export class AdditionalSupplyAmountSource {
  readonly type = 'additional' as const;
  amount: number; // base amount before scaling by flags
  isPerPerson: boolean;
  isPerDay: boolean;

  constructor(amount: number, isPerPerson: boolean, isPerDay: boolean) {
    this.amount = amount;
    this.isPerPerson = isPerPerson;
    this.isPerDay = isPerDay;
  }
}

export type AmountSource = RecipeAmountSource | AdditionalSupplyAmountSource;

export interface AggregatedItem {
  supply: Supply;
  amount: number; // total amount needed
  sources: AmountSource[];
}

export interface AggregatedShoppingList {
  [category: string]: AggregatedItem[];
}

export interface Cruise {
  id: string;
  name: string;
  dateCreated: string;
  dateModified: string;
  length: number; // in days
  crewMembers: CrewMember[]; // was: crew: number
  days: CruiseDay[];
  additionalSupplies?: CruiseSupply[];
  startDate?: string; // YYYY-MM-DD format
}

export interface CategoryGroup {
  category: string;
  supplies: Supply[];
}

export interface AdditionalSupplyItem {
  supply: Supply;
  amount: number;
  isPerPerson: boolean;
  isPerDay: boolean;
}

export interface AdditionalSupplyCategoryGroup {
  category: string;
  supplies: AdditionalSupplyItem[];
}

export interface CruiseFormData {
  name: string;
  length: number;
  crewMembers: CrewMember[];
  startDate?: string;
}

export interface CruiseFormErrors {
  name: string;
  length: string;
  crewMembers: string;
  startDate: string;
}

export interface SupplyValidationErrors {
  name: string;
  unit: string;
  category: string;
  isVegetarian: string;
  isVegan: string;
  general: string;
}
