import { Recipie, Ingredient, IngredientAmount, Supply } from '../types';
import recipies from '../data/recipies.json';
import suppliesData from '../data/supplies.json';

export function createRecipie(data: Recipie): Recipie {
  if (data.ingredients.length === 0) {
    throw new Error('Recipe must have at least one ingredient');
  }
  return data;
}

export function getRecipies(): Recipie[] {
  return ((recipies as unknown) as Recipie[]).map(r => createRecipie(r));
}

export function getRecipeById(id: string): Recipie | undefined {
  return getRecipies().find(recipie => recipie.id === id);
}

export function getIngredients(): Ingredient[] {
  return (suppliesData as Supply[]).filter(supply => supply.isIngredient === true) as Ingredient[];
}

export function getIngredientById(id: string): Ingredient | undefined {
  return getIngredients().find(ingredient => ingredient.id === id);
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
        isVegan: false
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

  // Defense-in-depth: legacy snapshots from localStorage may predate the factory guard
  if (ingredients.length === 0) return false;
  return ingredients.every(ing => ing.isVegetarian);
}

export function isRecipieVegan(dish: Recipie): boolean {
  const ingredients = dish.ingredients
    .map(ing => getIngredientById(ing.id))
    .filter((ing): ing is Ingredient => ing !== undefined);

  // Defense-in-depth: legacy snapshots from localStorage may predate the factory guard
  if (ingredients.length === 0) return false;
  return ingredients.every(ing => ing.isVegan);
}
