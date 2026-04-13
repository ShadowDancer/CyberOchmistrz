import { getAllSupplies, getIngredients, getNonIngredients, getSupplyById, getIngredientById, getSuppliesByType } from '../src/model/supplyData';
import { Supply, Ingredient } from '../src/types';

// Mocked data for testing
const mockedSupplies: Supply[] = [
  {
    id: 'maka',
    name: 'Mąka pszenna',
    unit: 'gramy',
    category: 'zboża',
    isVegetarian: true,
    isVegan: true,
    isIngredient: true,
    defaultAmount: 1000
  } as Ingredient,
  {
    id: 'cukier',
    name: 'Cukier',
    unit: 'gramy',
    category: 'inne',
    isVegetarian: true,
    isVegan: true,
    isIngredient: true
  } as Ingredient,
  {
    id: 'woda_butelkowana',
    name: 'Woda butelkowana',
    unit: 'sztuki',
    category: 'napoje',
    isIngredient: false
  },
  {
    id: 'papier_toaletowy',
    name: 'Papier toaletowy',
    unit: 'rolki',
    category: 'środki czystości',
    isIngredient: false
  }
];

// Mock the supplies.json file to return mocked data instead of loading from file
jest.doMock('../src/data/supplies.json', () => mockedSupplies);

// tests which verify correctness of supply module

describe('supplyData functions', () => {
  describe('getAllSupplies', () => {
    it('should return all supplies', () => {
      const supplies = getAllSupplies();
      expect(Array.isArray(supplies)).toBe(true);
      expect(supplies.length).toBeGreaterThan(0);
      supplies.forEach(supply => {
        expect(supply).toHaveProperty('id');
        expect(supply).toHaveProperty('name');
        expect(supply).toHaveProperty('unit');
        expect(supply).toHaveProperty('isIngredient');
        expect(supply).toHaveProperty('category');
      });
    });
  });

  describe('getIngredients', () => {
    it('should return only ingredients', () => {
      const ingredients = getIngredients();
      expect(Array.isArray(ingredients)).toBe(true);
      ingredients.forEach(ingredient => {
        expect(ingredient.isIngredient).toBe(true);
        expect(ingredient).toHaveProperty('category');
        expect(ingredient).toHaveProperty('isVegetarian');
        expect(ingredient).toHaveProperty('isVegan');
      });
    });
  });

  describe('getNonIngredients', () => {
    it('should return only non-ingredients', () => {
      const nonIngredients = getNonIngredients();
      expect(Array.isArray(nonIngredients)).toBe(true);
      nonIngredients.forEach(supply => {
        expect(supply.isIngredient).toBe(false);
      });
    });
  });

  describe('getSupplyById', () => {
    it('should return supply by id if exists', () => {
      const supply = getSupplyById('maka');
      expect(supply).toBeDefined();
      expect(supply?.id).toBe('maka');
      expect(supply?.name).toBe('Mąka pszenna');
    });

    it('should return ingredient with ingredient properties when querying an ingredient', () => {
      const supply = getSupplyById('maka');
      expect(supply).toBeDefined();
      expect(supply?.isIngredient).toBe(true);
      expect(supply).toHaveProperty('isVegan');
      expect((supply as any)?.isVegan).toBe(true);
    });

    it('should return undefined for non-existing id', () => {
      const supply = getSupplyById('non-existing');
      expect(supply).toBeUndefined();
    });
  });

  describe('getIngredientById', () => {
    it('should return ingredient by id if it is an ingredient', () => {
      const ingredient = getIngredientById('maka');
      expect(ingredient).toBeDefined();
      expect(ingredient?.id).toBe('maka');
      expect(ingredient?.isIngredient).toBe(true);
    });

    it('should return undefined for non-existing id', () => {
      const ingredient = getIngredientById('non-existing');
      expect(ingredient).toBeUndefined();
    });

    it('should return undefined if id exists but is not an ingredient', () => {
      const ingredient = getIngredientById('woda_butelkowana');
      expect(ingredient).toBeUndefined();
    });
  });

  describe('getSuppliesByType', () => {
    it('should return ingredients when showIngredients is true', () => {
      const supplies = getSuppliesByType(true);
      expect(Array.isArray(supplies)).toBe(true);
      supplies.forEach(supply => {
        expect(supply.isIngredient).toBe(true);
      });
    });

    it('should return non-ingredients when showIngredients is false', () => {
      const supplies = getSuppliesByType(false);
      expect(Array.isArray(supplies)).toBe(true);
      supplies.forEach(supply => {
        expect(supply.isIngredient).toBe(false);
      });
    });

    it('should have supplies that contain both ingredients and non-ingredients', () => {
      const allSupplies = getAllSupplies();
      const hasIngredients = allSupplies.some(supply => supply.isIngredient);
      const hasNonIngredients = allSupplies.some(supply => !supply.isIngredient);
      expect(hasIngredients).toBe(true);
      expect(hasNonIngredients).toBe(true);
    });
  });
});
