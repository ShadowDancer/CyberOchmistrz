import { Dish, Ingredient, IngredientAmount } from '../types';
import dishesData from '../data/dishes.json';
import ingredientsData from '../data/ingredients.json';

export function getDishes(): Dish[] {
  return dishesData as Dish[];
}

export function getIngredients(): Ingredient[] {
  return ingredientsData as Ingredient[];
}

export function getAllIngredients(): Ingredient[] {
  return ingredientsData as Ingredient[];
}

export function getIngredientById(id: string): Ingredient | undefined {
  return getIngredients().find(ingredient => ingredient.id === id);
}

export function getIngredientName(id: string): string {
  const ingredient = getIngredientById(id);
  return ingredient ? ingredient.name : 'Unknown Ingredient';
}

export function getIngredientUnit(id: string): string {
  const ingredient = getIngredientById(id);
  return ingredient ? ingredient.unit : '';
}

export function getDishIngredients(dishIngredients: IngredientAmount[]): (IngredientAmount & Ingredient)[] {
 
  return dishIngredients.map(ingAmount => {
    const ingredient = getIngredientById(ingAmount.id);
    if (!ingredient) {
      console.warn(`Ingredient with id "${ingAmount.id}" not found`);
      // Return a default ingredient to prevent errors
      return {
        ...ingAmount,
        name: `Unknown (${ingAmount.id})`,
        unit: '',
        category: 'inne' as const,
        isVegetarian: false,
        isVegan: false,
        freshnessDays: 0,
        storageType: 'room' as const
      } as (IngredientAmount & Ingredient);
    }
    return {
      ...ingAmount,
      ...ingredient
    } as (IngredientAmount & Ingredient);
  });
}

export function isDishVegetarian(dish: Dish): boolean {
  const ingredients = dish.ingredients
    .map(ing => getIngredientById(ing.id))
    .filter((ing): ing is Ingredient => ing !== undefined);
  
  return ingredients.every(ing => ing.isVegetarian);
}

export function isDishVegan(dish: Dish): boolean {
  const ingredients = dish.ingredients
    .map(ing => getIngredientById(ing.id))
    .filter((ing): ing is Ingredient => ing !== undefined);
  
  return ingredients.every(ing => ing.isVegan);
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