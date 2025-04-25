import { Dish, Ingredient } from '../types';
import dishesData from '../data/dishes.json';
import ingredientsData from '../data/ingredients.json';

export function getDishes(): Dish[] {
  return dishesData as Dish[];
}

export function getIngredients(): Ingredient[] {
  return ingredientsData as Ingredient[];
}

export function getIngredientById(id: string): Ingredient | undefined {
  return getIngredients().find(ingredient => ingredient.id === id);
}

export function getIngredientName(id: string): string {
  const ingredient = getIngredientById(id);
  return ingredient ? ingredient.name : 'Nieznany składnik';
}

export function getIngredientUnit(id: string): string {
  const ingredient = getIngredientById(id);
  return ingredient ? ingredient.unit : '';
}

export function getDishIngredients(dish: Dish): { 
  name: string; 
  amount: number; 
  unit: string; 
  category: string; 
  isVegetarian: boolean; 
  isVegan: boolean;
  freshnessDays: number;
  storageType: string;
}[] {
  return dish.ingredients.map(item => {
    const ingredient = getIngredientById(item.id);
    return {
      name: ingredient ? ingredient.name : 'Nieznany składnik',
      amount: item.amount,
      unit: ingredient ? ingredient.unit : '',
      category: ingredient ? ingredient.category : 'inne',
      isVegetarian: ingredient ? ingredient.isVegetarian : false,
      isVegan: ingredient ? ingredient.isVegan : false,
      freshnessDays: ingredient ? ingredient.freshnessDays : 0,
      storageType: ingredient ? ingredient.storageType : 'fridge'
    };
  });
}

export function isDishVegetarian(dish: Dish): boolean {
  const ingredients = dish.ingredients.map(item => getIngredientById(item.id));
  return ingredients.every(ingredient => ingredient && ingredient.isVegetarian);
}

export function isDishVegan(dish: Dish): boolean {
  const ingredients = dish.ingredients.map(item => getIngredientById(item.id));
  return ingredients.every(ingredient => ingredient && ingredient.isVegan);
}

export function getIngredientsByCategory(): Record<string, Ingredient[]> {
  const ingredients = getIngredients();
  return ingredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);
} 