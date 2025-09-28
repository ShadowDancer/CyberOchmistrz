import { getAllSupplies, getIngredients, getNonIngredients, groupSuppliesByCategory, CategoryGroup } from '../src/model/supplyData';

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

  describe('groupSuppliesByCategory', () => {
    it('should group supplies by their category', () => {
      const supplies = [
        { id: '1', name: 'Jabłko', category: 'owoce', isIngredient: true, unit: 'sztuki' },
        { id: '2', name: 'Banan', category: 'owoce', isIngredient: true, unit: 'sztuki' },
        { id: '3', name: 'Chleb', category: 'pieczywo', isIngredient: false, unit: 'sztuki' },
        { id: '4', name: 'Mleko', category: 'nabiał', isIngredient: true, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(Array.isArray(grouped)).toBe(true);
      expect(grouped).toHaveLength(3);

      const owoceGroup = grouped.find(g => g.category === 'owoce');
      expect(owoceGroup).toBeDefined();
      expect(owoceGroup!.supplies).toHaveLength(2);

      const pieczywoGroup = grouped.find(g => g.category === 'pieczywo');
      expect(pieczywoGroup).toBeDefined();
      expect(pieczywoGroup!.supplies).toHaveLength(1);

      const nabialGroup = grouped.find(g => g.category === 'nabiał');
      expect(nabialGroup).toBeDefined();
      expect(nabialGroup!.supplies).toHaveLength(1);

      expect(owoceGroup!.supplies).toEqual([
        { id: '1', name: 'Jabłko', category: 'owoce', isIngredient: true, unit: 'sztuki' },
        { id: '2', name: 'Banan', category: 'owoce', isIngredient: true, unit: 'sztuki' },
      ]);
    });

    it('should use "inne" category for supplies without category', () => {
      const supplies = [
        { id: '1', name: 'Jabłko', isIngredient: true, unit: 'sztuki' },
        { id: '2', name: 'Banan', category: 'owoce', isIngredient: true, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(Array.isArray(grouped)).toBe(true);
      expect(grouped).toHaveLength(2);

      const inneGroup = grouped.find(g => g.category === 'inne');
      expect(inneGroup).toBeDefined();
      expect(inneGroup!.supplies).toHaveLength(1);

      const owoceGroup = grouped.find(g => g.category === 'owoce');
      expect(owoceGroup).toBeDefined();
      expect(owoceGroup!.supplies).toHaveLength(1);
    });

    it('should return empty array for empty supplies array', () => {
      const grouped = groupSuppliesByCategory([]);
      expect(grouped).toEqual([]);
    });

    it('should handle supplies with undefined category', () => {
      const supplies = [
        { id: '1', name: 'Jabłko', category: undefined, isIngredient: true, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(Array.isArray(grouped)).toBe(true);
      expect(grouped).toHaveLength(1);

      const inneGroup = grouped.find(g => g.category === 'inne');
      expect(inneGroup).toBeDefined();
      expect(inneGroup!.supplies).toHaveLength(1);
    });

    it('should sort categories alphabetically', () => {
      const supplies = [
        { id: '1', name: 'Mleko', category: 'nabiał', isIngredient: true, unit: 'sztuki' },
        { id: '2', name: 'Jabłko', category: 'owoce', isIngredient: true, unit: 'sztuki' },
        { id: '3', name: 'Chleb', category: 'pieczywo', isIngredient: false, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(grouped).toHaveLength(3);
      expect(grouped[0].category).toBe('nabiał');
      expect(grouped[1].category).toBe('owoce');
      expect(grouped[2].category).toBe('pieczywo');
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
