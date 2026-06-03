export interface Supply {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly description?: string;
  readonly isIngredient: boolean;
  readonly category: string;
  readonly defaultAmount?: number;
}

export interface Ingredient extends Supply {
  readonly category: 'nabiał' | 'mięso' | 'warzywa' | 'owoce' | 'pieczywo' | 'zboża' | 'przyprawy' | 'tłuszcze' | 'napoje' | 'środki czystości' | 'inne';
  readonly isVegetarian: boolean;
  readonly isVegan: boolean;
}

export interface CategoryGroup {
  readonly category: string;
  readonly supplies: Supply[];
}

export interface AdditionalSupplyItem {
  readonly supply: Supply;
  readonly amount: number;
  readonly isPerPerson: boolean;
  readonly isPerDay: boolean;
}

export interface AdditionalSupplyCategoryGroup {
  readonly category: string;
  readonly supplies: AdditionalSupplyItem[];
}
