import { createTestRecipe, createCruiseWithRecipes } from './cruiseTestHarness';

describe('CruiseReorderingRecipiesTests', () => {

  describe('reorderRecipesInCruiseDay', () => {
    it('should reorder recipes within a day', () => {
      const recipe1 = createTestRecipe('recipe-1', 'Recipe 1');
      const recipe2 = createTestRecipe('recipe-2', 'Recipe 2');
      const recipe3 = createTestRecipe('recipe-3', 'Recipe 3');

      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [
          { recipeId: 'recipe-1', recipeData: recipe1 },
          { recipeId: 'recipe-2', recipeData: recipe2 },
          { recipeId: 'recipe-3', recipeData: recipe3 }
        ]
      });

      const updatedCruise = cruise.reorderRecipes(1, 0, 2);

      const recipes = updatedCruise.days[0].recipes;
      expect(recipes).toHaveLength(3);
      expect(recipes[0].originalRecipeId).toBe('recipe-2');
      expect(recipes[1].originalRecipeId).toBe('recipe-3');
      expect(recipes[2].originalRecipeId).toBe('recipe-1');
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });

      const updatedCruise = cruise.reorderRecipes(10, 0, 2);

      expect(updatedCruise).toBe(cruise);
    });

    it('should do nothing if fromIndex is out of bounds', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });

      const updatedCruise = cruise.reorderRecipes(1, 5, 0);

      expect(updatedCruise).toBe(cruise);

    });

    it('should do nothing if toIndex is out of bounds', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });

      const updatedCruise = cruise.reorderRecipes(1, 0, 5);

      expect(updatedCruise).toBe(cruise);
    });
  });
});
