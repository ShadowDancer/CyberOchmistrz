import {Cruise, Recipie, AggregatedShoppingList, AggregatedItem, AmountSource, Supply} from '../types';
import { getSupplyById } from './supplyData';

const STORAGE_KEY = 'cyber-ochmistrz-cruises';

export function getCruises(): Cruise[] {
  if (typeof window === 'undefined') return [];
  
  
  const storedCruises = localStorage.getItem(STORAGE_KEY);
  return storedCruises ? JSON.parse(storedCruises) : [];
}

export function getCruiseById(id: string): Cruise | undefined {
  return getCruises().find(cruise => cruise.id === id);
}

export function saveCruise(cruise: Cruise): void {
  if (typeof window === 'undefined') return;
  
  const cruises = getCruises();
  const existingIndex = cruises.findIndex(c => c.id === cruise.id);
  
  if (existingIndex >= 0) {
    cruises[existingIndex] = {
      ...cruise,
      dateModified: new Date().toISOString()
    };
  } else {
    cruises.push(cruise);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cruises));
}

export function deleteCruise(id: string): void {
  if (typeof window === 'undefined') return;
  
  const cruises = getCruises().filter(cruise => cruise.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cruises));
}

export function createNewCruise(name: string, length: number, crew: number): Cruise {
  const now = new Date().toISOString();
  
  // Create an array of days with empty recipe arrays
  const days = Array.from({ length }, (_, i) => ({
    dayNumber: i + 1,
    recipes: []
  }));
  
  return {
    id: Date.now().toString(),
    name,
    dateCreated: now,
    dateModified: now,
    length,
    crew,
    days
  };
}

export function addRecipeToCruiseDay(cruiseId: string, dayNumber: number, recipeId: string, recipeData?: Recipie): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;

  cruise.days[dayIndex].recipes.push({
    originalRecipeId: recipeId,
    recipeData: recipeData ? JSON.parse(JSON.stringify(recipeData)) : undefined
  });
  saveCruise(cruise);
}

export function removeRecipeFromCruiseDay(cruiseId: string, dayNumber: number, recipeId: string, recipeIndex: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  const recipies = cruise.days[dayIndex].recipes;
  // Remove only the recipe at the specific index
  if (recipeIndex >= 0 && recipeIndex < recipies.length && recipies[recipeIndex].originalRecipeId === recipeId) {
    recipies.splice(recipeIndex, 1);
    saveCruise(cruise);
  }
}

// Function to add a supply to a cruise's additional supplies list
export function addAdditionalSupplyToCruise(cruiseId: string, supplyId: string, amount: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  // Initialize additional supplies array if it doesn't exist
  if (!cruise.additionalSupplies) {
    cruise.additionalSupplies = [];
  }
  
  // Check if the supply already exists
  const existingSupplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId);
  
  if (existingSupplyIndex >= 0) {
    // Update existing supply
    cruise.additionalSupplies[existingSupplyIndex].amount = amount;
  } else {
    // Add new supply
    cruise.additionalSupplies.push({ id: supplyId, amount });
  }
  
  saveCruise(cruise);
}

// Function to update the amount of an additional supply
export function updateAdditionalSupplyAmount(cruiseId: string, supplyId: string, amount: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return;
  
  const supplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) return;
  
  cruise.additionalSupplies[supplyIndex].amount = amount;
  saveCruise(cruise);
}

// Function to remove a supply from a cruise's additional supplies list
export function removeAdditionalSupplyFromCruise(cruiseId: string, supplyId: string): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return;
  
  cruise.additionalSupplies = cruise.additionalSupplies.filter(s => s.id !== supplyId);
  saveCruise(cruise);
}

// Function to update an ingredient in a recipe that's part of a cruise
export function updateRecipeIngredientInCruise(
  cruiseId: string, 
  dayNumber: number, 
  recipeIndex: number, 
  ingredientIndex: number, 
  newAmount: number
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  // Get the recipe at the specified index
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe || !recipe.recipeData) return;
  
  // Ensure ingredients array exists and the index is valid
  if (!recipe.recipeData.ingredients || 
      ingredientIndex < 0 || 
      ingredientIndex >= recipe.recipeData.ingredients.length) {
    return;
  }
  
  // Update the ingredient amount
  recipe.recipeData.ingredients[ingredientIndex].amount = newAmount;
  saveCruise(cruise);
}

// Function to add a new ingredient to a recipe that's part of a cruise
export function addIngredientToRecipeInCruise(
  cruiseId: string,
  dayNumber: number,
  recipeIndex: number,
  ingredientId: string,
  amount: number
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  // Get the recipe at the specified index
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe || !recipe.recipeData) return;
  
  // Ensure ingredients array exists
  if (!recipe.recipeData.ingredients) {
    recipe.recipeData.ingredients = [];
  }
  
  // Add the new ingredient
  recipe.recipeData.ingredients.push({ id: ingredientId, amount });
  saveCruise(cruise);
}

// Function to remove an ingredient from a recipe that's part of a cruise
export function removeIngredientFromRecipeInCruise(
  cruiseId: string,
  dayNumber: number,
  recipeIndex: number,
  ingredientIndex: number
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  // Get the recipe at the specified index
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe || !recipe.recipeData) return;
  
  // Ensure ingredients array exists and the index is valid
  if (!recipe.recipeData.ingredients || 
      ingredientIndex < 0 || 
      ingredientIndex >= recipe.recipeData.ingredients.length) {
    return;
  }
  
  // Remove the ingredient
  recipe.recipeData.ingredients.splice(ingredientIndex, 1);
  saveCruise(cruise);
}

// Function to aggregate shopping list for a cruise
export function aggregateShoppingList(cruise: Cruise): AggregatedShoppingList {
  // Map to hold all items with their total amounts and sources
  const itemsMap: Map<string, { supply: Supply, amount: number, sources: AmountSource[] }> = new Map();

  // Helper function to add items to the itemsMap
  const addToItemsMap = (
    itemsMap: Map<string, { supply: Supply, amount: number, sources: AmountSource[] }>,
    supply: Supply,
    amount: number,
    source: AmountSource
  ) => {
    if (itemsMap.has(supply.id)) {
      // Add to existing item
      const existingItem = itemsMap.get(supply.id)!;
      existingItem.amount += amount;
      existingItem.sources.push(source);
    } else {
      // Add new item
      itemsMap.set(supply.id, {
        supply,
        amount,
        sources: [source]
      });
    }
  };

  // Helper function to create invalid supply placeholder
  const createInvalidSupply = (id: string, isIngredient: boolean): Supply => ({
    id,
    name: `Nieprawidłowy produkt: ${id}`,
    unit: 'sztuki',
    isIngredient: isIngredient,
    category: 'Nieprawidłowe produkty'
  });

  // 1. Add ingredients from recipes in the meal plan
  cruise.days.forEach(day => {
    day.recipes.forEach(recipe => {
      // Use the recipe data stored in the cruise if available, otherwise fall back to the original recipe
      const recipeData = recipe.recipeData;
      if (recipeData) {
        recipeData.ingredients.forEach(ingredientAmount => {
          let ingredient = getSupplyById(ingredientAmount.id);
          if (!ingredient) {
            ingredient = createInvalidSupply(ingredientAmount.id, true);
          }
          // Adjust amount based on crew size
          const scaledAmount = ingredientAmount.amount * cruise.crew;
          const source: AmountSource = {
            type: 'recipe',
            amount: scaledAmount,
            recipeName: recipeData.name,
            dayNumber: day.dayNumber
          };

          addToItemsMap(itemsMap, ingredient, scaledAmount, source);
        });
      }
    });
  });

  // 2. Add items from additional supplies
  if (cruise.additionalSupplies) {
    cruise.additionalSupplies.forEach(item => {
      let supply = getSupplyById(item.id);
      if (!supply) {
        supply = createInvalidSupply(item.id, false);
      }
      const source: AmountSource = {
        type: 'additional',
        amount: item.amount
      };

      addToItemsMap(itemsMap, supply, item.amount, source);
    });
  }

  // Group items by category
  const groupedItems: AggregatedShoppingList = {};

  itemsMap.forEach((item) => {
    const category = item.supply.category || (item.supply.isIngredient ? 'inne' : 'Pozostałe produkty');

    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }

    groupedItems[category].push(item as AggregatedItem);
  });

  // Sort items in each category alphabetically
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => a.supply.name.localeCompare(b.supply.name, 'pl'));
  });

  return groupedItems;
}
