export interface Supply {
  id: string;
  name: string;
  unit: string;
  description?: string;
  isIngredient: boolean;
  category: string;
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
}

export interface CruiseSupply {
  id: string;
  amount: number;
  isPerPerson: boolean;
  isPerDay: boolean;
}

export interface CruiseDay {
  dayNumber: number;
  recipes: { 
    originalRecipeId: string;
    recipeData?: Recipie;  // Stored copy of the recipe at the time it was added to the cruise
  }[];
}

export class RecipeAmountSource {
  readonly type = 'recipe' as const;
  amount: number; // base amount before crew scaling
  recipeName?: string;
  dayNumber?: number;

  constructor(amount: number, recipeName?: string, dayNumber?: number) {
    this.amount = amount;
    this.recipeName = recipeName;
    this.dayNumber = dayNumber;
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
  crew: number;
  days: CruiseDay[];
  additionalSupplies?: CruiseSupply[];
}
