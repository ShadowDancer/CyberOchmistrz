export interface Supply {
  id: string;
  name: string;
  unit: string;
  description?: string;
  isIngredient: boolean;
  category: string;
  defaultAmount?: number;
}

export interface Ingredient extends Supply {
  category: 'nabiał' | 'mięso' | 'warzywa' | 'owoce' | 'pieczywo' | 'zboża' | 'przyprawy' | 'tłuszcze' | 'napoje' | 'środki czystości' | 'inne';
  isVegetarian: boolean;
  isVegan: boolean;
}

export interface CategoryGroup {
  category: string;
  supplies: Supply[];
}

export interface AdditionalSupplyItem {
  supply: Supply;
  amount: number;
  isPerPerson: boolean;
  isPerDay: boolean;
}

export interface AdditionalSupplyCategoryGroup {
  category: string;
  supplies: AdditionalSupplyItem[];
}
