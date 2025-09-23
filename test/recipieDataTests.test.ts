// Mock the JSON data
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

import { getRecipies, getRecipeById, getIngredients, getIngredientById, getRecipieIngredients, isRecipieVegetarian, isRecipieVegan } from '../src/model/recipieData';
import { Recipie, Ingredient, IngredientAmount, MealType } from '../src/types';

describe('recipieData', () => {
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
      expect(recipe).toBeDefined();
      expect(recipe?.id).toBe('omelet-zombie');
      expect(recipe?.name).toBe('Omelet z mózgu zombie');
    });

    it('should return undefined if recipe not found', () => {
      const recipe = getRecipeById('nonexistent');
      expect(recipe).toBeUndefined();
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
      expect(ingredient).toBeDefined();
      expect(ingredient?.id).toBe('czosnek');
      expect(ingredient?.name).toBe('czosnek');
    });

    it('should return undefined if ingredient not found', () => {
      const ingredient = getIngredientById('nonexistent');
      expect(ingredient).toBeUndefined();
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
      expect(result[0].id).toBe('czosnek');
      expect(result[0].amount).toBe(100);
      expect(result[0].name).toBe('czosnek');
      expect(result[1].id).toBe('ser');
      expect(result[1].amount).toBe(200);
      expect(result[1].name).toBe('ser');
    });

    it('should handle unknown ingredients gracefully', () => {
      const ingredientAmounts: IngredientAmount[] = [
        { id: 'unknown', amount: 50 }
      ];
      const result = getRecipieIngredients(ingredientAmounts);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('unknown');
      expect(result[0].amount).toBe(50);
      expect(result[0].name).toBe('Unknown (unknown)');
    });
  });

  describe('isRecipieVegetarian', () => {
    it('should return true if all ingredients are vegetarian', () => {
      const recipe: Recipie = {
        id: 'veg-omelet',
        name: 'Wegetariański omlet z czosnkiem',
        ingredients: [
          { id: 'czosnek', amount: 100 } // vegetarian and vegan
        ],
        description: 'Śniadanie dla wegetarian',
        mealType: [MealType.BREAKFAST],
        difficulty: 1,
        instructions: ['Mieszaj']
      };
      expect(isRecipieVegetarian(recipe)).toBe(true);
    });

    it('should return false if any ingredient is not vegetarian', () => {
      const recipe: Recipie = {
        id: 'meat-bigos',
        name: 'Mięsny bigos z podstępną kiełbasą',
        ingredients: [
          { id: 'czosnek', amount: 100 }, // vegetarian
          { id: 'kiełbasa-podstępna', amount: 200 } // not vegetarian
        ],
        description: 'Tradycyjny polski bigos',
        mealType: [MealType.DINNER],
        difficulty: 2,
        instructions: ['Gotuj']
      };
      expect(isRecipieVegetarian(recipe)).toBe(false);
    });

    it('should return true if ingredient not found (unknown ingredients are ignored)', () => {
      const recipe: Recipie = {
        id: '3',
        name: 'Tajemniczy gulasz',
        ingredients: [
          { id: 'unknown', amount: 100 }
        ],
        description: 'Nieznany przepis',
        mealType: [MealType.SUPPER],
        difficulty: 3,
        instructions: ['Przygotuj']
      };
      expect(isRecipieVegetarian(recipe)).toBe(true);
    });
  });

  describe('isRecipieVegan', () => {
    it('should return true if all ingredients are vegan', () => {
      const recipe: Recipie = {
        id: 'vegan-smoothie',
        name: 'Wegański koktajl z czosnkiem',
        ingredients: [
          { id: 'czosnek', amount: 100 } // vegan
        ],
        description: 'Zdrowy koktajl',
        mealType: [MealType.BREAKFAST],
        difficulty: 1,
        instructions: ['Blenduj']
      };
      expect(isRecipieVegan(recipe)).toBe(true);
    });

    it('should return false if any ingredient is not vegan', () => {
      const recipe: Recipie = {
        id: 'non-vegan-dessert',
        name: 'Nie wegański deser z serem',
        ingredients: [
          { id: 'czosnek', amount: 100 }, // vegan
          { id: 'ser', amount: 200 } // not vegan
        ],
        description: 'Deser z nabiałem',
        mealType: [MealType.DINNER],
        difficulty: 2,
        instructions: ['Smaż']
      };
      expect(isRecipieVegan(recipe)).toBe(false);
    });

    it('should return true if ingredient not found (unknown ingredients are ignored)', () => {
      const recipe: Recipie = {
        id: '3',
        name: 'Tajemniczy sos',
        ingredients: [
          { id: 'unknown', amount: 100 }
        ],
        description: 'Tajemniczy przepis',
        mealType: [MealType.SUPPER],
        difficulty: 3,
        instructions: ['Przygotuj']
      };
      expect(isRecipieVegan(recipe)).toBe(true);
    });
  });
});
