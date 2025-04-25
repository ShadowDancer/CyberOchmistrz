export interface Ingredient {
  id: string;
  name: string;
  unit: string;
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

export interface Dish {
  id: number;
  name: string;
  ingredients: IngredientAmount[];
  equipment: string[];
  description: string;
  mealType: 'śniadanie' | 'obiad' | 'kolacja' | 'przekąska';
  difficulty: number; // 1-5 stars
  tasteScore: number; // 1-5 stars
  preparationTime: number; // time in minutes
  instructions: string[]; // array of preparation steps
} 