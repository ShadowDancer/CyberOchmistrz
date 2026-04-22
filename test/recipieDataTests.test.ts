jest.mock('../src/data/recipies.json', () => [
  {
    id: 'omelet-zombie',
    name: 'Omelet z mózgu zombie',
    ingredients: [
      { id: 'czosnek', amount: 100 },
      { id: 'ser', amount: 200 }
    ],
    description: 'Straszne śniadanie, które obudzi umarłych',
    mealType: ['sniadanie'],
    difficulty: 3,
    instructions: ['Krok 1', 'Krok 2'],
    developedBy: 'Szalony Kucharz'
  },
  {
    id: 'zupa-niewidzialna',
    name: 'Niewidzialna zupa',
    ingredients: [
      { id: 'kiełbasa-podstępna', amount: 150 }
    ],
    description: 'Nie widać jej, ale jest pyszna',
    mealType: ['obiad'],
    difficulty: 2,
    instructions: ['Krok A', 'Krok B'],
    developedBy: 'Duch Kucharz'
  }
]);

jest.mock('../src/data/supplies.json', () => [
  {
    id: 'czosnek',
    name: 'czosnek',
    unit: 'g',
    isIngredient: true,
    category: 'warzywa',
    isVegetarian: true,
    isVegan: true
  },
  {
    id: 'ser',
    name: 'ser',
    unit: 'ml',
    isIngredient: true,
    category: 'nabiał',
    isVegetarian: true,
    isVegan: false
  },
  {
    id: 'kiełbasa-podstępna',
    name: 'Podstępna kiełbasa',
    unit: 'kg',
    isIngredient: true,
    category: 'mięso',
    isVegetarian: false,
    isVegan: false
  },
  {
    id: 'supply1',
    name: 'Supply 1',
    unit: 'pcs',
    isIngredient: false,
    category: 'inne'
  }
]);

import { getRecipies, getRecipeById, getIngredients, getIngredientById, getRecipieIngredients, isRecipieVegetarian, isRecipieVegan, createRecipie } from '../src/model/recipieData';
import { Recipie, IngredientAmount, MealType } from '../src/types';

describe('recipieData', () => {
  /** Builds raw Recipie data for tests that need to bypass createRecipie (e.g. diet function defense-in-depth). */
  const makeRawRecipe = (overrides?: Partial<Recipie>): Recipie => ({
    id: 'test-recipe',
    name: 'Test Recipe',
    ingredients: [{ id: 'czosnek', amount: 1 }],
    description: '',
    mealType: [MealType.DINNER],
    difficulty: 1,
    instructions: [],
    ...overrides,
  });

  describe('getRecipies', () => {
    it('should return all recipes', () => {
      const recipes = getRecipies();
      expect(recipes).toHaveLength(2);
      expect(recipes[0].id).toBe('omelet-zombie');
      expect(recipes[1].id).toBe('zupa-niewidzialna');
    });
  });

  describe('getRecipeById', () => {
    it('should return the recipe with the given id', () => {
      const recipe = getRecipeById('omelet-zombie');
      expect(recipe).toEqual(expect.objectContaining({ id: 'omelet-zombie', name: 'Omelet z mózgu zombie' }));
    });

    it('should return undefined if recipe not found', () => {
      expect(getRecipeById('nonexistent')).toBeUndefined();
    });
  });

  describe('getIngredients', () => {
    it('should return all ingredients', () => {
      const ingredients = getIngredients();
      expect(ingredients).toHaveLength(3);
      expect(ingredients.every(ing => ing.isIngredient)).toBe(true);
    });
  });

  describe('getIngredientById', () => {
    it('should return the ingredient with the given id', () => {
      const ingredient = getIngredientById('czosnek');
      expect(ingredient).toEqual(expect.objectContaining({ id: 'czosnek', name: 'czosnek' }));
    });

    it('should return undefined if ingredient not found', () => {
      expect(getIngredientById('nonexistent')).toBeUndefined();
    });
  });

  describe('getRecipieIngredients', () => {
    it('should return ingredients with amounts and details', () => {
      const ingredientAmounts: IngredientAmount[] = [
        { id: 'czosnek', amount: 100 },
        { id: 'ser', amount: 200 }
      ];
      const result = getRecipieIngredients(ingredientAmounts);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ id: 'czosnek', amount: 100, name: 'czosnek' }));
      expect(result[1]).toEqual(expect.objectContaining({ id: 'ser', amount: 200, name: 'ser' }));
    });

    it('should handle unknown ingredients gracefully', () => {
      const result = getRecipieIngredients([{ id: 'unknown', amount: 50 }]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: 'unknown', amount: 50, name: 'Unknown (unknown)' }));
    });
  });

  describe('isRecipieVegetarian', () => {
    it('should return true if all ingredients are vegetarian', () => {
      expect(isRecipieVegetarian(makeRawRecipe({ ingredients: [{ id: 'czosnek', amount: 100 }] }))).toBe(true);
    });

    it('should return false if any ingredient is not vegetarian', () => {
      expect(isRecipieVegetarian(makeRawRecipe({
        ingredients: [{ id: 'czosnek', amount: 100 }, { id: 'kiełbasa-podstępna', amount: 200 }],
      }))).toBe(false);
    });

    it('should return false if all ingredients are unknown (no resolved ingredients)', () => {
      expect(isRecipieVegetarian(makeRawRecipe({ ingredients: [{ id: 'unknown', amount: 100 }] }))).toBe(false);
    });
  });

  describe('isRecipieVegan', () => {
    it('should return true if all ingredients are vegan', () => {
      expect(isRecipieVegan(makeRawRecipe({ ingredients: [{ id: 'czosnek', amount: 100 }] }))).toBe(true);
    });

    it('should return false if any ingredient is not vegan', () => {
      expect(isRecipieVegan(makeRawRecipe({
        ingredients: [{ id: 'czosnek', amount: 100 }, { id: 'ser', amount: 200 }],
      }))).toBe(false);
    });

    it('should return false if all ingredients are unknown (no resolved ingredients)', () => {
      expect(isRecipieVegan(makeRawRecipe({ ingredients: [{ id: 'unknown', amount: 100 }] }))).toBe(false);
    });
  });

  describe('createRecipie', () => {
    it('should throw when ingredients array is empty', () => {
      expect(() => createRecipie(makeRawRecipe({ ingredients: [] }))).toThrow('Recipe must have at least one ingredient');
    });

    it('should return the recipe when ingredients are present', () => {
      const data = makeRawRecipe({ ingredients: [{ id: 'czosnek', amount: 1 }] });
      expect(createRecipie(data)).toBe(data);
    });
  });

  describe('empty-ingredients defense-in-depth', () => {
    it('should classify empty-ingredients recipe as not vegetarian', () => {
      expect(isRecipieVegetarian(makeRawRecipe({ ingredients: [] }))).toBe(false);
    });

    it('should classify empty-ingredients recipe as not vegan', () => {
      expect(isRecipieVegan(makeRawRecipe({ ingredients: [] }))).toBe(false);
    });
  });
});
