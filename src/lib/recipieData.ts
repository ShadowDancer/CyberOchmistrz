import { Recipie, Ingredient, IngredientAmount } from '../types';
import recipies from '../data/recipies.json';
import suppliesData from '../data/supplies.json';

export function getRecipies(): Recipie[] {
  return recipies as Recipie[];
}

export function getRecipeById(id: number): Recipie | undefined {
  return getRecipies().find(recipie => recipie.id === id);
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

export function getRecipieIngredients(ingredients: IngredientAmount[]): (IngredientAmount & Ingredient)[] {
 
  return ingredients.map(ing => {
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

export function isRecipieVegetarian(dish: Recipie): boolean {
  const ingredients = dish.ingredients
    .map(ing => getIngredientById(ing.id))
    .filter((ing): ing is Ingredient => ing !== undefined);
  
  return ingredients.every(ing => ing.isVegetarian);
}

export function isRecipieVegan(dish: Recipie): boolean {
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