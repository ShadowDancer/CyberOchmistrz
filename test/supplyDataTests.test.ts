import { getAllSupplies, getIngredients, getNonIngredients, groupSuppliesByCategory } from '../src/model/supplyData';
import { CategoryGroup, SupplyValidationErrors } from '../src/types';

describe('supplyData functions', () => {
  const findGroup = (groups: CategoryGroup[], category: string) =>
    groups.find(g => g.category === category);

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

  describe('groupSuppliesByCategory', () => {
    it('should group supplies by their category', () => {
      const supplies = [
        { id: '1', name: 'Jabłko', category: 'owoce', isIngredient: true, unit: 'sztuki' },
        { id: '2', name: 'Banan', category: 'owoce', isIngredient: true, unit: 'sztuki' },
        { id: '3', name: 'Chleb', category: 'pieczywo', isIngredient: false, unit: 'sztuki' },
        { id: '4', name: 'Mleko', category: 'nabiał', isIngredient: true, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(grouped).toHaveLength(3);
      expect(findGroup(grouped, 'owoce')!.supplies).toHaveLength(2);
      expect(findGroup(grouped, 'pieczywo')!.supplies).toHaveLength(1);
      expect(findGroup(grouped, 'nabiał')!.supplies).toHaveLength(1);

      expect(findGroup(grouped, 'owoce')!.supplies).toEqual([
        expect.objectContaining({ id: '1', name: 'Jabłko' }),
        expect.objectContaining({ id: '2', name: 'Banan' }),
      ]);
    });

    it('should use "inne" category for supplies without category', () => {
      const supplies = [
        { id: '1', name: 'Jabłko', category: '', isIngredient: true, unit: 'sztuki' },
        { id: '2', name: 'Banan', category: 'owoce', isIngredient: true, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(grouped).toHaveLength(2);
      expect(findGroup(grouped, 'inne')!.supplies).toHaveLength(1);
      expect(findGroup(grouped, 'owoce')!.supplies).toHaveLength(1);
    });

    it('should return empty array for empty supplies array', () => {
      const grouped = groupSuppliesByCategory([]);
      expect(grouped).toEqual([]);
    });

    it('should handle supplies with empty category', () => {
      const supplies = [
        { id: '1', name: 'Jabłko', category: '', isIngredient: true, unit: 'sztuki' }
      ];

      const grouped = groupSuppliesByCategory(supplies);

      expect(grouped).toHaveLength(1);
      expect(findGroup(grouped, 'inne')!.supplies).toHaveLength(1);
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

import { validateSupplyData, isSupplyDataValid, validateNewSupply } from '../src/model/supplyData';

describe('Supply Validation', () => {
  describe('validateSupplyData', () => {
    const noErrors = { name: '', unit: '', category: '', isVegetarian: '', isVegan: '', general: '' };

    it('should validate a valid supply', () => {
      expect(validateSupplyData({ name: 'Test Product', unit: 'sztuki', category: 'inne', isIngredient: false }))
        .toEqual(noErrors);
    });

    it('should validate a valid ingredient', () => {
      expect(validateSupplyData({ name: 'Test Ingredient', unit: 'kg', category: 'warzywa', isIngredient: true, isVegetarian: true, isVegan: true }))
        .toEqual(noErrors);
    });

    it('should require name', () => {
      const supply = {
        unit: 'sztuki',
        category: 'inne',
        isIngredient: false
      };

      const errors = validateSupplyData(supply);
      expect(errors.name).toBe('Nazwa produktu jest wymagana');
    });

    it('should require unit', () => {
      const supply = {
        name: 'Test Product',
        category: 'inne',
        isIngredient: false
      };

      const errors = validateSupplyData(supply);
      expect(errors.unit).toBe('Jednostka jest wymagana');
    });

    it('should require category', () => {
      const supply = {
        name: 'Test Product',
        unit: 'sztuki',
        isIngredient: false
      };

      const errors = validateSupplyData(supply);
      expect(errors.category).toBe('Kategoria jest wymagana');
    });

    it('should validate ingredient category', () => {
      const supply = {
        name: 'Test Ingredient',
        unit: 'kg',
        category: 'invalid_category',
        isIngredient: true,
        isVegetarian: true,
        isVegan: true
      };

      const errors = validateSupplyData(supply);
      expect(errors.category).toBe('Nieprawidłowa kategoria dla składnika');
    });

    it('should require isVegetarian boolean for ingredients', () => {
      const supply = {
        name: 'Test Ingredient',
        unit: 'kg',
        category: 'warzywa',
        isIngredient: true,
        isVegan: true
      };

      const errors = validateSupplyData(supply);
      expect(errors.isVegetarian).toBe('Wymagana wartość logiczna dla wegetariańskiego');
    });

    it('should require isVegan boolean for ingredients', () => {
      const supply = {
        name: 'Test Ingredient',
        unit: 'kg',
        category: 'warzywa',
        isIngredient: true,
        isVegetarian: true
      };

      const errors = validateSupplyData(supply);
      expect(errors.isVegan).toBe('Wymagana wartość logiczna dla wegańskiego');
    });
  });

  describe('isSupplyDataValid', () => {
    it('should return true for valid data', () => {
      const errors: SupplyValidationErrors = {
        name: '',
        unit: '',
        category: '',
        isVegetarian: '',
        isVegan: '',
        general: ''
      };

      expect(isSupplyDataValid(errors)).toBe(true);
    });

    it('should return false when there are errors', () => {
      const errors: SupplyValidationErrors = {
        name: 'Error',
        unit: '',
        category: '',
        isVegetarian: '',
        isVegan: '',
        general: ''
      };

      expect(isSupplyDataValid(errors)).toBe(false);
    });
  });

  describe('validateNewSupply', () => {
    it('should validate a new unique supply', () => {
      const supply = {
        name: 'Unique Test Product',
        unit: 'sztuki',
        category: 'inne',
        isIngredient: false
      };

      const errors = validateNewSupply(supply);
      expect(errors.name).toBe('');
      expect(errors.unit).toBe('');
      expect(errors.category).toBe('');
    });

    it('should detect duplicate names', () => {
      // Get an existing supply name
      const existingSupply = getAllSupplies()[0];
      const supply = {
        name: existingSupply.name,
        unit: 'sztuki',
        category: 'inne',
        isIngredient: false
      };

      const errors = validateNewSupply(supply);
      expect(errors.name).toBe(`Produkt o nazwie "${existingSupply.name}" już istnieje`);
    });

    it('should be case insensitive for duplicate names', () => {
      const existingSupply = getAllSupplies()[0];
      const supply = {
        name: existingSupply.name.toUpperCase(),
        unit: 'sztuki',
        category: 'inne',
        isIngredient: false
      };

      const errors = validateNewSupply(supply);
      expect(errors.name).toBe(`Produkt o nazwie "${existingSupply.name.toUpperCase()}" już istnieje`);
    });
  });
});
