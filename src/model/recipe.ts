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

export enum MealType {
  BREAKFAST = 'śniadanie',
  DINNER = 'obiad',
  SUPPER = 'kolacja',
  SNACK = 'przekąska'
}

export interface IngredientAmount {
  id: string;
  amount: number;
}
