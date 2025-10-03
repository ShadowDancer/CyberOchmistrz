'use client';

import {Supply, Ingredient, CategoryGroup, SupplyValidationErrors} from '@/types';
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

export function validateSupplyData(supply: Partial<Supply & { isVegetarian?: boolean; isVegan?: boolean }>): SupplyValidationErrors {
  const errors: SupplyValidationErrors = {
    name: '',
    unit: '',
    category: '',
    isVegetarian: '',
    isVegan: '',
    general: ''
  };

  // Required field validations
  if (!supply.name || supply.name.trim() === '') {
    errors.name = 'Nazwa produktu jest wymagana';
  }

  if (!supply.unit || supply.unit.trim() === '') {
    errors.unit = 'Jednostka jest wymagana';
  }

  if (!supply.category || supply.category.trim() === '') {
    errors.category = 'Kategoria jest wymagana';
  }

  // Ingredient-specific validations
  if (supply.isIngredient) {
    const validIngredientCategories = [
      'nabiał', 'mięso', 'warzywa', 'owoce', 'pieczywo', 'zboża',
      'przyprawy', 'tłuszcze', 'napoje', 'środki czystości', 'inne'
    ];

    if (supply.category && !validIngredientCategories.includes(supply.category)) {
      errors.category = 'Nieprawidłowa kategoria dla składnika';
    }

    // isVegetarian and isVegan should be boolean values for ingredients
    if (typeof supply.isVegetarian !== 'boolean') {
      errors.isVegetarian = 'Wymagana wartość logiczna dla wegetariańskiego';
    }

    if (typeof supply.isVegan !== 'boolean') {
      errors.isVegan = 'Wymagana wartość logiczna dla wegańskiego';
    }
  }

  return errors;
}

export function isSupplyDataValid(errors: SupplyValidationErrors): boolean {
  return !Object.values(errors).some(error => error !== '');
}

export function validateNewSupply(supply: Partial<Supply & { isVegetarian?: boolean; isVegan?: boolean }>): SupplyValidationErrors {
  const errors = validateSupplyData(supply);

  // Check for duplicate names
  if (supply.name && supply.name.trim() !== '') {
    const existingSupply = getAllSupplies().find(s =>
      s.name.toLowerCase() === supply.name!.toLowerCase().trim()
    );
    if (existingSupply) {
      errors.name = `Produkt o nazwie "${supply.name.trim()}" już istnieje`;
    }
  }

  return errors;
}
