import { getAllSupplies, getIngredients, getNonIngredients } from '../src/model/supplyData';

// Tests which validate correctness of supplies in data file

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
        expect(supply).not.toHaveProperty('isVegetarian');
        expect(supply).not.toHaveProperty('isVegan');
      });
    });
  });
});

/* Disabling for now as there is pending MR
describe('supplies data sorting', () => {
  it('should have supplies sorted by name', () => {
    const supplies = getAllSupplies();
    const sortedSupplies = [...supplies].sort((a, b) => a.name.localeCompare(b.name));
    expect(supplies).toEqual(sortedSupplies);
  });
});
*/
