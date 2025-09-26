'use client';

import { Supply, Ingredient } from '@/types';
import suppliesData from '../data/supplies.json';

function castData(): Supply[] {
  return suppliesData as Supply[];
}

export function getAllSupplies(): Supply[] {
  return castData();
}

export function getIngredients(): Ingredient[] {
  return castData().filter(supply => supply.isIngredient) as Ingredient[];
}

export function getNonIngredients(): Supply[] {
  return castData().filter(supply => !supply.isIngredient);
}

export function getSupplyById(id: string): Supply | undefined {
  return castData().find(supply => supply.id === id);
}

export function getIngredientById(id: string): Ingredient | undefined {
  const supply = getSupplyById(id);
  return supply && supply.isIngredient ? supply as Ingredient : undefined;
}

export function getSuppliesByType(showIngredients: boolean): Supply[] {
  return showIngredients ? getIngredients() : getNonIngredients();
}

export interface CategoryGroup {
  category: string;
  supplies: Supply[];
}

export function groupSuppliesByCategory(supplies: Supply[]): CategoryGroup[] {
  const grouped: {[key: string]: Supply[]} = {};

  supplies.forEach(supply => {
    const category = supply.category || 'inne';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(supply);
  });

  // Convert to array and sort by category name for consistent display order
  return Object.keys(grouped)
    .sort()
    .map(category => ({
      category,
      supplies: grouped[category]
    }));
}
