import { createNewCruise, addRecipeToCruiseDay, removeRecipeFromCruiseDay } from '../src/model/cruiseData';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock, createTestRecipe, createCruiseWithRecipes } from './cruiseTestHarness';

describe('cruiseRecipeData', () => {
  const getUpdatedCruise = () => getStoredCruises()[0];

  const setupEmptyCruise = (id: string, length = 3) => {
    const cruise = createNewCruise('Test Cruise', length, 2);
    cruise.id = id;
    setupCruises([cruise]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearCruises();
  });

  describe('addRecipeToCruiseDay', () => {
    it('should add a recipe to a valid cruise day', () => {
      setupEmptyCruise('test-cruise-1');
      const recipeData = createTestRecipe('recipe-1', 'Test Recipe');

      addRecipeToCruiseDay('test-cruise-1', 2, 'recipe-1', recipeData);

      const updated = getUpdatedCruise();
      expect(updated.days[1].recipes).toHaveLength(1);
      expect(updated.days[1].recipes[0]).toEqual({ originalRecipeId: 'recipe-1', recipeData });
    });

    it('should add a recipe reference without recipeData', () => {
      setupEmptyCruise('test-cruise-1');

      addRecipeToCruiseDay('test-cruise-1', 1, 'recipe-1');

      const updated = getUpdatedCruise();
      expect(updated.days[0].recipes).toHaveLength(1);
      expect(updated.days[0].recipes[0]).toEqual({ originalRecipeId: 'recipe-1', recipeData: undefined });
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);
      addRecipeToCruiseDay('nonexistent-cruise', 1, 'recipe-1');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      setupEmptyCruise('test-cruise-1');
      addRecipeToCruiseDay('test-cruise-1', 10, 'recipe-1');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should copy recipe data when adding to cruise', () => {
      setupEmptyCruise('test-cruise-1');
      const originalRecipeData = createTestRecipe('recipe-1', 'Original Recipe');

      addRecipeToCruiseDay('test-cruise-1', 2, 'recipe-1', originalRecipeData);

      originalRecipeData.name = 'Modified Recipe';
      originalRecipeData.ingredients[0].amount = 200;
      originalRecipeData.description = 'Modified description';
      originalRecipeData.instructions.push('Step 3');

      const recipeInCruise = getUpdatedCruise().days[1].recipes[0].recipeData;
      expect(recipeInCruise).toBeDefined();
      expect(recipeInCruise).not.toBe(originalRecipeData);
      expect(recipeInCruise!.name).toBe('Original Recipe');
      expect(recipeInCruise!.ingredients[0].amount).toBe(100);
      expect(recipeInCruise!.description).toBe('Test recipe description');
      expect(recipeInCruise!.instructions).toEqual(['Step 1', 'Step 2']);
    });
  });

  describe('removeRecipeFromCruiseDay', () => {
    it('should remove a recipe from a valid position', () => {
      const recipeData = createTestRecipe('recipe-1', 'Test Recipe');
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        2: [{ recipeId: 'recipe-1', recipeData }, { recipeId: 'recipe-2' }]
      });
      setupCruises([cruise]);

      removeRecipeFromCruiseDay('test-cruise-1', 2, 'recipe-1', 0);

      const updated = getUpdatedCruise();
      expect(updated.days[1].recipes).toHaveLength(1);
      expect(updated.days[1].recipes[0]).toEqual({ originalRecipeId: 'recipe-2', recipeData: undefined });
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);
      removeRecipeFromCruiseDay('nonexistent-cruise', 1, 'recipe-1', 0);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      setupEmptyCruise('test-cruise-1');
      removeRecipeFromCruiseDay('test-cruise-1', 10, 'recipe-1', 0);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if recipe index is out of bounds', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });
      setupCruises([cruise]);

      removeRecipeFromCruiseDay('test-cruise-1', 1, 'recipe-1', 5);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if recipe ID does not match at the given index', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });
      setupCruises([cruise]);

      removeRecipeFromCruiseDay('test-cruise-1', 1, 'wrong-recipe-id', 0);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should remove an unknown recipe (recipeData is undefined)', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'unknown-recipe', recipeData: undefined }]
      });
      setupCruises([cruise]);

      removeRecipeFromCruiseDay('test-cruise-1', 1, 'unknown-recipe', 0);

      expect(getUpdatedCruise().days[0].recipes).toHaveLength(0);
    });
  });
});
