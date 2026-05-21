import { Supply } from "./supply";

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
