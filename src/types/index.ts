export interface Supply {
  id: string;
  name: string;
  unit: string;
  isIngredient: boolean;
}

export interface Ingredient extends Supply {
  category: 'nabiał' | 'mięso' | 'warzywa' | 'owoce' | 'pieczywo' | 'zboża' | 'przyprawy' | 'tłuszcze' | 'inne';
  isVegetarian: boolean;
  isVegan: boolean;
  freshnessDays: number; // how long the ingredient stays fresh in days
  storageType: 'room' | 'fridge' | 'freezer'; // where the ingredient should be stored
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
  id: number;
  name: string;
  ingredients: IngredientAmount[];
  equipment: string[];
  description: string;
  mealType: MealType[];
  difficulty: number; // 1-5 stars
  tasteScore: number; // 1-5 stars
  preparationTime: number; // time in minutes
  instructions: string[]; // array of preparation steps
}

export interface CruiseSupply {
  id: string;
  amount: number;
}

export interface CruiseDay {
  dayNumber: number;
  recipes: number[]; // Dish IDs
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