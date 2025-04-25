import { Recipie, Ingredient, IngredientAmount } from '../types';
import dishesData from '../data/recipies.json';
import suppliesData from '../data/supplies.json';

export function getDishes(): Recipie[] {
  return dishesData as Recipie[];
}

export function getDishById(id: number): Recipie | undefined {
  return getDishes().find(dish => dish.id === id);
}

export function getIngredients(): Ingredient[] {
  return (suppliesData as any[]).filter(supply => supply.isIngredient === true) as Ingredient[];
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

export function getRecipieIngredients(dishIngredients: IngredientAmount[]): (IngredientAmount & Ingredient)[] {
 
  return dishIngredients.map(ing => {
    const ingredient = getIngredientById(ing.id);
    if (!ingredient) {
      console.warn(`Ingredient with id "${ing.id}" not found`);
      // Return a default ingredient to prevent errors
      return {
        ...ing,
        name: `Unknown (${ing.id})`,
        unit: '',
        category: 'inne' as const,
        isVegetarian: false,
        isVegan: false,
        freshnessDays: 0,
        storageType: 'room' as const
      } as (IngredientAmount & Ingredient);
    }
    return {
      ...ing,
      ...ingredient
    } as (IngredientAmount & Ingredient);
  });
}

export function isDishVegetarian(dish: Recipie): boolean {
  const ingredients = dish.ingredients
    .map(ing => getIngredientById(ing.id))
    .filter((ing): ing is Ingredient => ing !== undefined);
  
  return ingredients.every(ing => ing.isVegetarian);
}

export function isDishVegan(dish: Recipie): boolean {
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