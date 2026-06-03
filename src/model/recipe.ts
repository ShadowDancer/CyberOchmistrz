export interface Recipie {
  readonly id: string;
  readonly name: string;
  readonly ingredients: readonly IngredientAmount[];
  readonly description: string;
  readonly mealType: readonly MealType[];
  readonly difficulty: number; // 1-5 stars
  readonly instructions: readonly string[]; // array of preparation steps
  readonly developedBy?: string; // Author of the recipe
  readonly modifiedBy?: readonly string[]; // Array of people who modified the recipe
}

export enum MealType {
  BREAKFAST = 'śniadanie',
  DINNER = 'obiad',
  SUPPER = 'kolacja',
  SNACK = 'przekąska'
}

export interface IngredientAmount {
  readonly id: string;
  readonly amount: number;
}
