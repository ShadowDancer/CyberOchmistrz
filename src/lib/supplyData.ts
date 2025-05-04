'use client';

import { Supply, Ingredient } from '../types';
import suppliesData from '../data/supplies.json';

// Helper to cast raw JSON data to our types
function castData(): Supply[] {
  return suppliesData as Supply[];
}

// Get all supplies (both ingredients and non-ingredients)
export function getAllSupplies(): Supply[] {
  return castData();
}

// Get only ingredients (isIngredient = true)
export function getIngredients(): Ingredient[] {
  return castData().filter(supply => supply.isIngredient) as Ingredient[];
}

// Get only non-ingredients (isIngredient = false)
export function getNonIngredients(): Supply[] {
  return castData().filter(supply => !supply.isIngredient);
}

// Get supply by ID
export function getSupplyById(id: string): Supply | undefined {
  return castData().find(supply => supply.id === id);
}

// Get ingredient by ID (returns undefined if not an ingredient)
export function getIngredientById(id: string): Ingredient | undefined {
  const supply = getSupplyById(id);
  return supply && supply.isIngredient ? supply as Ingredient : undefined;
}

// Function to get supplies filtered by isIngredient value
export function getSuppliesByType(showIngredients: boolean): Supply[] {
  return castData().filter(supply => supply.isIngredient === showIngredients);
} 