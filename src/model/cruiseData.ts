import {
  Cruise,
  Recipie,
  AggregatedShoppingList,
  AggregatedItem,
  AmountSource,
  Supply,
  RecipeAmountSource,
  AdditionalSupplyAmountSource,
  AdditionalSupplyCategoryGroup, AdditionalSupplyItem, CruiseFormData, CruiseFormErrors
} from '../types';
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

export function addAdditionalSupplyToCruise(cruiseId: string, supplyId: string, amount: number, isPerPerson: boolean, isPerDay: boolean): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  // Initialize additional supplies array if it doesn't exist
  if (!cruise.additionalSupplies) {
    cruise.additionalSupplies = [];
  }

  // Check if the supply with same flags already exists
  const existingSupplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId && s.isPerPerson === isPerPerson && s.isPerDay === isPerDay);

  if (existingSupplyIndex >= 0) {
    // Update existing supply
    cruise.additionalSupplies[existingSupplyIndex].amount += amount;
  } else {
    // Add new supply
    cruise.additionalSupplies.push({ id: supplyId, amount, isPerPerson, isPerDay });
  }

  saveCruise(cruise);
}

export function updateAdditionalSupplyAmount(cruiseId: string, supplyId: string, amount: number, isPerPerson: boolean, isPerDay: boolean): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  // Initialize additional supplies array if it doesn't exist
  if (!cruise.additionalSupplies) {
    cruise.additionalSupplies = [];
  }

  const supplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId && s.isPerPerson === isPerPerson && s.isPerDay === isPerDay);
  if (supplyIndex >= 0) {
    // Update existing supply
    cruise.additionalSupplies[supplyIndex].amount = amount;
  } else {
    // Add new supply if it doesn't exist
    cruise.additionalSupplies.push({ id: supplyId, amount, isPerPerson, isPerDay });
  }

  saveCruise(cruise);
}

export function removeAdditionalSupplyFromCruise(cruiseId: string, supplyId: string, isPerPerson: boolean, isPerDay: boolean): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return;

  cruise.additionalSupplies = cruise.additionalSupplies.filter(s => !(s.id === supplyId && s.isPerPerson === isPerPerson && s.isPerDay === isPerDay));
  saveCruise(cruise);
}

export function hasAdditionalSupply(cruiseId: string, supplyId: string, isPerPerson: boolean, isPerDay: boolean): boolean {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return false;

  return cruise.additionalSupplies.some(item =>
    item.id === supplyId && item.isPerPerson === isPerPerson && item.isPerDay === isPerDay
  );
}

export function getAdditionalSupplyAmount(cruiseId: string, supplyId: string, isPerPerson: boolean, isPerDay: boolean): number | null {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return null;

  const item = cruise.additionalSupplies.find(item =>
    item.id === supplyId && item.isPerPerson === isPerPerson && item.isPerDay === isPerDay
  );

  return item ? item.amount : null;
}
export function groupAdditionalSuppliesByCategory(cruiseId: string): AdditionalSupplyCategoryGroup[] {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return [];

  const grouped: {[key: string]: AdditionalSupplyItem[]} = {};

  cruise.additionalSupplies.forEach(item => {
    const supplyDetails = getSupplyById(item.id);
    if (supplyDetails) {
      const category = supplyDetails.category || (supplyDetails.isIngredient ? 'inne' : 'Pozostałe produkty');

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        supply: supplyDetails,
        amount: item.amount,
        isPerPerson: item.isPerPerson,
        isPerDay: item.isPerDay
      });
    }
  });

  // Convert to array and sort by category name for consistent display order
  return Object.keys(grouped)
    .sort()
    .map(category => ({
      category,
      supplies: grouped[category].sort((a, b) => {
        // First sort by supply name
        const nameComparison = a.supply.name.localeCompare(b.supply.name, 'pl');
        if (nameComparison !== 0) {
          return nameComparison;
        }

        // If names are equal, sort by flag combination priority: fixed -> per person -> per day -> per person per day
        const getPriority = (item: AdditionalSupplyItem) => {
          if (!item.isPerPerson && !item.isPerDay) return 0; // fixed
          if (item.isPerPerson && !item.isPerDay) return 1; // per person
          if (!item.isPerPerson && item.isPerDay) return 2; // per day
          return 3; // per person per day
        };

        return getPriority(a) - getPriority(b);
      })
    }));
}

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

export function reorderRecipesInCruiseDay(
  cruiseId: string,
  dayNumber: number,
  fromIndex: number,
  toIndex: number
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;

  const recipes = cruise.days[dayIndex].recipes;
  if (fromIndex < 0 || fromIndex >= recipes.length || toIndex < 0 || toIndex >= recipes.length) {
    return;
  }

  // Reorder the recipes array
  const [movedRecipe] = recipes.splice(fromIndex, 1);
  recipes.splice(toIndex, 0, movedRecipe);

  saveCruise(cruise);
}

export function willLengthReductionRemoveRecipes(cruiseId: string, newLength: number): boolean {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || newLength >= cruise.length) return false;

  // Check if any days being removed (from newLength+1 to current length) have recipes
  for (let dayNum = newLength + 1; dayNum <= cruise.length; dayNum++) {
    const day = cruise.days.find(d => d.dayNumber === dayNum);
    if (day && day.recipes.length > 0) {
      return true;
    }
  }
  return false;
}

export function updateCruiseDetails(cruiseId: string, name: string, length: number, crew: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  cruise.name = name;
  cruise.crew = crew;

  if (length > cruise.length) {
    // Add new empty days
    for (let i = cruise.length + 1; i <= length; i++) {
      cruise.days.push({
        dayNumber: i,
        recipes: []
      });
    }
  } else if (length < cruise.length) {
    // Remove days from the end
    cruise.days = cruise.days.filter(day => day.dayNumber <= length);
  }

  cruise.length = length;
  saveCruise(cruise);
}
export function validateCruiseForm(formData: CruiseFormData): CruiseFormErrors {
  const errors: CruiseFormErrors = {
    name: '',
    length: '',
    crew: ''
  };

  if (!formData.name.trim()) {
    errors.name = 'Nazwa rejsu jest wymagana';
  }

  if (formData.length < 1) {
    errors.length = 'Długość rejsu musi być większa niż 0';
  } else if (formData.length >= 100) {
    errors.length = 'Długość rejsu nie może być większa niż 99 dni';
  }

  if (formData.crew < 1) {
    errors.crew = 'Liczba załogantów musi być większa niż 0';
  } else if (formData.crew >= 100) {
    errors.crew = 'Liczba załogantów nie może być większa niż 99 osób';
  }

  return errors;
}

export function isCruiseFormValid(errors: CruiseFormErrors): boolean {
  return !Object.values(errors).some(error => error !== '');
}

export function moveRecipeBetweenCruiseDays(
  cruiseId: string,
  fromDayNumber: number,
  toDayNumber: number,
  fromIndex: number,
  toIndex?: number
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  const fromDayIndex = cruise.days.findIndex(day => day.dayNumber === fromDayNumber);
  const toDayIndex = cruise.days.findIndex(day => day.dayNumber === toDayNumber);

  if (fromDayIndex === -1 || toDayIndex === -1) return;

  const fromRecipes = cruise.days[fromDayIndex].recipes;
  const toRecipes = cruise.days[toDayIndex].recipes;

  if (fromIndex < 0 || fromIndex >= fromRecipes.length) return;

  // Remove recipe from source day
  const [movedRecipe] = fromRecipes.splice(fromIndex, 1);

  // Add recipe to target day at specified index or at the end
  const insertIndex = toIndex !== undefined && toIndex >= 0 && toIndex <= toRecipes.length ? toIndex : toRecipes.length;
  toRecipes.splice(insertIndex, 0, movedRecipe);

  saveCruise(cruise);
}

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
          const source = new RecipeAmountSource(ingredientAmount.amount, recipeData.name, day.dayNumber);

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
      // Calculate scaled amount based on flags
      const crewMultiplier = item.isPerPerson ? cruise.crew : 1;
      const dayMultiplier = item.isPerDay ? cruise.length : 1;
      const scaledAmount = item.amount * crewMultiplier * dayMultiplier;
      const source = new AdditionalSupplyAmountSource(item.amount, item.isPerPerson, item.isPerDay);

      addToItemsMap(itemsMap, supply, scaledAmount, source);
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
