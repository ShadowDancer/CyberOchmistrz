import { Cruise } from "./cruise";
import { Supply } from "./supply";
import { getSupplyById } from "./supplyData";

export interface AggregatedShoppingList {
  [category: string]: AggregatedItem[];
}

export interface AggregatedItem {
  supply: Supply;
  amount: number; // total amount needed
  sources: AmountSource[];
}

export type AmountSource = RecipeAmountSource | AdditionalSupplyAmountSource;

export class RecipeAmountSource {
  readonly type = 'recipe' as const;
  amount: number; // base amount before crew scaling
  recipeName?: string;
  dayNumber?: number;
  crewCount: number;

  constructor(amount: number, recipeName?: string, dayNumber?: number, crewCount: number = 1) {
    this.amount = amount;
    this.recipeName = recipeName;
    this.dayNumber = dayNumber;
    this.crewCount = crewCount;
  }
}

export class AdditionalSupplyAmountSource {
  readonly type = 'additional' as const;
  amount: number; // base amount before scaling by flags
  isPerPerson: boolean;
  isPerDay: boolean;

  constructor(amount: number, isPerPerson: boolean, isPerDay: boolean) {
    this.amount = amount;
    this.isPerPerson = isPerPerson;
    this.isPerDay = isPerDay;
  }
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

  // 1. Add ingredients from recipes in the meal plan, scaled by each recipe's crewCount
  cruise.days.forEach(day => {
    day.recipes.forEach(recipe => {
      // Use the recipe data stored in the cruise if available, otherwise fall back to the original recipe
      if (recipe.crewCount === 0) return;
      const recipeData = recipe.recipeData;
      if (recipeData) {
        recipeData.ingredients.forEach(ingredientAmount => {
          let ingredient = getSupplyById(ingredientAmount.id);
          if (!ingredient) {
            ingredient = createInvalidSupply(ingredientAmount.id, true);
          }
          // Adjust amount based on crew size for each recipe
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
      // Calculate scaled amount based on flags
      const crewMultiplier = item.isPerPerson ? cruise.crewMembers.length : 1;
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
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
