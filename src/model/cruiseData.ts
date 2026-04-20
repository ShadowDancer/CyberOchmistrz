import {
  Cruise,
  CrewMember,
  Recipie,
  MealType,
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

export function createNewCruise(name: string, length: number, crewMembers: CrewMember[], startDate?: string): Cruise {
  const now = new Date().toISOString();

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
    crewMembers,
    days,
    startDate
  };
}

export function addRecipeToCruiseDay(
  cruiseId: string,
  dayNumber: number,
  recipeId: string,
  recipeData: Recipie,
  crewCount: number,
  mealSlot: MealType
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;

  cruise.days[dayIndex].recipes.push({
    originalRecipeId: recipeId,
    recipeData: JSON.parse(JSON.stringify(recipeData)),
    crewCount,
    mealSlot,
  });
  saveCruise(cruise);
}

export function setRecipeCrewCount(
  cruiseId: string,
  dayNumber: number,
  recipeIndex: number,
  crewCount: number
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;

  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe) return;

  recipe.crewCount = crewCount;
  saveCruise(cruise);
}

export function setRecipeMealSlot(
  cruiseId: string,
  dayNumber: number,
  recipeIndex: number,
  mealSlot: MealType
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;

  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe) return;

  recipe.mealSlot = mealSlot;
  saveCruise(cruise);
}

export function removeRecipeFromCruiseDay(cruiseId: string, dayNumber: number, recipeId: string, recipeIndex: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  const recipies = cruise.days[dayIndex].recipes;
  if (recipeIndex >= 0 && recipeIndex < recipies.length && recipies[recipeIndex].originalRecipeId === recipeId) {
    recipies.splice(recipeIndex, 1);
    saveCruise(cruise);
  }
}

export function addAdditionalSupplyToCruise(cruiseId: string, supplyId: string, amount: number, isPerPerson: boolean, isPerDay: boolean): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  if (!cruise.additionalSupplies) {
    cruise.additionalSupplies = [];
  }

  const existingSupplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId && s.isPerPerson === isPerPerson && s.isPerDay === isPerDay);

  if (existingSupplyIndex >= 0) {
    cruise.additionalSupplies[existingSupplyIndex].amount += amount;
  } else {
    cruise.additionalSupplies.push({ id: supplyId, amount, isPerPerson, isPerDay });
  }

  saveCruise(cruise);
}

export function updateAdditionalSupplyAmount(cruiseId: string, supplyId: string, amount: number, isPerPerson: boolean, isPerDay: boolean): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  if (!cruise.additionalSupplies) {
    cruise.additionalSupplies = [];
  }

  const supplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId && s.isPerPerson === isPerPerson && s.isPerDay === isPerDay);
  if (supplyIndex >= 0) {
    cruise.additionalSupplies[supplyIndex].amount = amount;
  } else {
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

  return Object.keys(grouped)
    .sort()
    .map(category => ({
      category,
      supplies: grouped[category].sort((a, b) => {
        const nameComparison = a.supply.name.localeCompare(b.supply.name, 'pl');
        if (nameComparison !== 0) {
          return nameComparison;
        }

        const getPriority = (item: AdditionalSupplyItem) => {
          if (!item.isPerPerson && !item.isPerDay) return 0;
          if (item.isPerPerson && !item.isPerDay) return 1;
          if (!item.isPerPerson && item.isPerDay) return 2;
          return 3;
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
  
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe || !recipe.recipeData) return;
  
  if (!recipe.recipeData.ingredients || 
      ingredientIndex < 0 || 
      ingredientIndex >= recipe.recipeData.ingredients.length) {
    return;
  }
  
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
  
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe || !recipe.recipeData) return;
  
  if (!recipe.recipeData.ingredients) {
    recipe.recipeData.ingredients = [];
  }
  
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
  
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe || !recipe.recipeData) return;
  
  if (!recipe.recipeData.ingredients || 
      ingredientIndex < 0 || 
      ingredientIndex >= recipe.recipeData.ingredients.length) {
    return;
  }
  
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

  const [movedRecipe] = recipes.splice(fromIndex, 1);
  recipes.splice(toIndex, 0, movedRecipe);

  saveCruise(cruise);
}

export function willLengthReductionRemoveRecipes(cruiseId: string, newLength: number): boolean {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || newLength >= cruise.length) return false;

  for (let dayNum = newLength + 1; dayNum <= cruise.length; dayNum++) {
    const day = cruise.days.find(d => d.dayNumber === dayNum);
    if (day && day.recipes.length > 0) {
      return true;
    }
  }
  return false;
}

export function updateCruiseDetails(cruiseId: string, name: string, length: number, crewMembers: CrewMember[], startDate?: string): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;

  cruise.name = name;
  cruise.crewMembers = crewMembers;
  cruise.startDate = startDate;

  if (length > cruise.length) {
    for (let i = cruise.length + 1; i <= length; i++) {
      cruise.days.push({
        dayNumber: i,
        recipes: []
      });
    }
  } else if (length < cruise.length) {
    cruise.days = cruise.days.filter(day => day.dayNumber <= length);
  }

  cruise.length = length;
  saveCruise(cruise);
}

export function validateCruiseForm(formData: CruiseFormData): CruiseFormErrors {
  const errors: CruiseFormErrors = {
    name: '',
    length: '',
    crewMembers: '',
    startDate: ''
  };

  if (!formData.name.trim()) {
    errors.name = 'Nazwa rejsu jest wymagana';
  }

  if (formData.length < 1) {
    errors.length = 'Długość rejsu musi być większa niż 0';
  } else if (formData.length >= 100) {
    errors.length = 'Długość rejsu nie może być większa niż 99 dni';
  }

  if (formData.crewMembers.length < 1) {
    errors.crewMembers = 'Liczba załogantów musi być większa niż 0';
  } else if (formData.crewMembers.length >= 100) {
    errors.crewMembers = 'Liczba załogantów nie może być większa niż 99 osób';
  }

  if (formData.startDate && formData.startDate.trim() !== '') {
    const date = new Date(formData.startDate);
    if (isNaN(date.getTime())) {
      errors.startDate = 'Nieprawidłowa data rozpoczęcia';
    }
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

  const [movedRecipe] = fromRecipes.splice(fromIndex, 1);

  const insertIndex = toIndex !== undefined && toIndex >= 0 && toIndex <= toRecipes.length ? toIndex : toRecipes.length;
  toRecipes.splice(insertIndex, 0, movedRecipe);

  saveCruise(cruise);
}

export function aggregateShoppingList(cruise: Cruise): AggregatedShoppingList {
  const itemsMap: Map<string, { supply: Supply, amount: number, sources: AmountSource[] }> = new Map();

  const addToItemsMap = (
    itemsMap: Map<string, { supply: Supply, amount: number, sources: AmountSource[] }>,
    supply: Supply,
    amount: number,
    source: AmountSource
  ) => {
    if (itemsMap.has(supply.id)) {
      const existingItem = itemsMap.get(supply.id)!;
      existingItem.amount += amount;
      existingItem.sources.push(source);
    } else {
      itemsMap.set(supply.id, {
        supply,
        amount,
        sources: [source]
      });
    }
  };

  const createInvalidSupply = (id: string, isIngredient: boolean): Supply => ({
    id,
    name: `Nieprawidłowy produkt: ${id}`,
    unit: 'sztuki',
    isIngredient: isIngredient,
    category: 'Nieprawidłowe produkty'
  });

  // 1. Add ingredients from recipes in the meal plan, scaled by each recipe's crewCount
  cruise.days.forEach(day => {
    day.recipes.forEach(recipe => {
      if (recipe.crewCount === 0) return;
      const recipeData = recipe.recipeData;
      if (recipeData) {
        recipeData.ingredients.forEach(ingredientAmount => {
          let ingredient = getSupplyById(ingredientAmount.id);
          if (!ingredient) {
            ingredient = createInvalidSupply(ingredientAmount.id, true);
          }
          const scaledAmount = ingredientAmount.amount * recipe.crewCount;
          const source = new RecipeAmountSource(ingredientAmount.amount, recipeData.name, day.dayNumber, recipe.crewCount);

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
      const crewMultiplier = item.isPerPerson ? cruise.crewMembers.length : 1;
      const dayMultiplier = item.isPerDay ? cruise.length : 1;
      const scaledAmount = item.amount * crewMultiplier * dayMultiplier;
      const source = new AdditionalSupplyAmountSource(item.amount, item.isPerPerson, item.isPerDay);

      addToItemsMap(itemsMap, supply, scaledAmount, source);
    });
  }

  const groupedItems: AggregatedShoppingList = {};

  itemsMap.forEach((item) => {
    const category = item.supply.category || (item.supply.isIngredient ? 'inne' : 'Pozostałe produkty');

    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }

    groupedItems[category].push(item as AggregatedItem);
  });

  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => a.supply.name.localeCompare(b.supply.name, 'pl'));
  });

  return groupedItems;
}

export function generateShoppingListCSV(aggregatedList: AggregatedShoppingList): string {
  const headers = ['Kategoria', 'Nazwa produktu', 'Ilość', 'Jednostka', 'Opis'];
  const rows: string[] = [];

  rows.push(headers.join(','));

  const sortedCategories = Object.keys(aggregatedList).sort();

  sortedCategories.forEach(category => {
    const items = aggregatedList[category];

    items.forEach(item => {
      const row = [
        escapeCSVValue(category),
        escapeCSVValue(item.supply.name),
        item.amount.toString(),
        escapeCSVValue(item.supply.unit),
        escapeCSVValue(item.supply.description || '')
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
