import { Cruise } from '@/model/cruise';
import { MealType } from '../src/model/recipe';
import { createTestRecipe, createCruiseWithRecipes, makeCrewMembers } from './cruiseTestHarness';

describe('cruiseRecipeData', () => {

  const setupEmptyCruise = (length = 3) : Cruise => {
    return Cruise.createNew('Test Cruise', length, makeCrewMembers(2));
  };

  describe('addRecipeToCruiseDay', () => {
    it('should add a recipe to a valid cruise day', () => {
      const cruise = setupEmptyCruise();
      const recipeData = createTestRecipe('recipe-1', 'Test Recipe');

      const updated = cruise.insertRecipe(2, { recipeData, crewCount: 2, mealSlot: MealType.DINNER, originalRecipeId: 'recipe-1' });

      expect(updated.days[1].recipes).toHaveLength(1);
      expect(updated.days[1].recipes[0]).toEqual(expect.objectContaining({
        originalRecipeId: 'recipe-1',
        recipeData,
        crewCount: 2,
        mealSlot: MealType.DINNER,
      }));
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = setupEmptyCruise();
      const recipeData = createTestRecipe('recipe-1', 'Test Recipe');

      const updated = cruise.insertRecipe(2000, { recipeData, crewCount: 2, mealSlot: MealType.DINNER, originalRecipeId: 'recipe-1' });

      expect(cruise).toBe(updated);
    });

    it('should copy recipe data when adding to cruise', () => {
      const cruise = setupEmptyCruise();
      const originalRecipeData = createTestRecipe('recipe-1', 'Original Recipe');

      const updated = cruise.insertRecipe(2, { recipeData: originalRecipeData, crewCount: 2, mealSlot: MealType.DINNER, originalRecipeId: 'recipe-1' });

      const recipeInCruise = updated.days[1].recipes[0].recipeData;
      expect(recipeInCruise).toBeDefined();
      expect(recipeInCruise).not.toBe(originalRecipeData);
    });
  });

  describe('removeRecipeFromCruiseDay', () => {
    it('should remove a recipe from a valid position', () => {
      const recipeData = createTestRecipe('recipe-1', 'Test Recipe');
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        2: [{ recipeId: 'recipe-1', recipeData }, { recipeId: 'recipe-2' }]
      });


      const updated = cruise.removeRecipe(2, 'recipe-1', 0);

      expect(updated.days[1].recipes).toHaveLength(1);
      expect(updated.days[1].recipes[0]).toEqual(expect.objectContaining({ originalRecipeId: 'recipe-2' }));
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = setupEmptyCruise();

      const updated = cruise.removeRecipe(10, 'recipe-1', 0);

      expect(updated).toBe(cruise);
    });

    it('should do nothing if recipe index is out of bounds', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });

      const updated = cruise.removeRecipe(1, 'recipe-1', 5);

      expect(updated).toBe(cruise);
    });

    it('should do nothing if recipe ID does not match at the given index', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });

      const updated = cruise.removeRecipe(1, 'wrong-recipe-id', 0);

      expect(updated).toBe(cruise);

    });

    it('should remove a recipe added without explicit recipeData', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'unknown-recipe' }]
      });

      const updated = cruise.removeRecipe(1, 'unknown-recipe', 0);

      expect(updated.days[0].recipes).toHaveLength(0);
    });
  });
});
