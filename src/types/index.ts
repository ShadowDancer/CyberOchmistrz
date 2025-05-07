export interface Supply {
  id: string;
  name: string;
  unit: string;
  isIngredient: boolean;
  category: string;
}

export interface Ingredient extends Supply {
  category: 'nabiał' | 'mięso' | 'warzywa' | 'owoce' | 'pieczywo' | 'zboża' | 'przyprawy' | 'tłuszcze' | 'inne';
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
}

export interface CruiseSupply {
  id: string;
  amount: number;
}

export interface CruiseDay {
  dayNumber: number;
  recipes: string[]; // Recipie IDs as strings
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