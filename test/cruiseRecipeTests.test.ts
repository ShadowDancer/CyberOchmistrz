import { createNewCruise, addRecipeToCruiseDay, removeRecipeFromCruiseDay } from '../src/model/cruiseData';
import { Cruise, Recipie, MealType } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock } from './cruiseTestHarness';

// Helper to create a test recipe
const createTestRecipe = (id: string, name: string): Recipie => ({
  id,
  name,
  ingredients: [{ id: 'test-ingredient', amount: 100 }],
  description: 'Test recipe description',
  mealType: [MealType.DINNER],
  difficulty: 2,
  instructions: ['Step 1', 'Step 2'],
  developedBy: 'Test Chef'
});

// Helper to create a cruise with recipes on specific days
const createCruiseWithRecipes = (id: string, name: string, length: number, recipesByDay: { [dayNumber: number]: { recipeId: string; recipeData?: Recipie }[] }): Cruise => {
  const cruise = createNewCruise(name, length, 2);
  cruise.id = id;

  Object.entries(recipesByDay).forEach(([dayNum, recipes]) => {
    const dayNumber = parseInt(dayNum);
    const dayIndex = cruise.days.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex >= 0) {
      cruise.days[dayIndex].recipes = recipes.map(r => ({
        originalRecipeId: r.recipeId,
        recipeData: r.recipeData
      }));
    }
  });

  return cruise;
};

describe('cruiseRecipeData', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    clearCruises();
  });

  describe('addRecipeToCruiseDay', () => {
    it('should add a recipe to a valid cruise day', () => {
      const cruise = createNewCruise('Test Cruise', 3, 2);
      cruise.id = 'test-cruise-1';
      setupCruises([cruise]);

      const recipeData = createTestRecipe('recipe-1', 'Test Recipe');
      addRecipeToCruiseDay('test-cruise-1', 2, 'recipe-1', recipeData);

      const storedCruises = getStoredCruises();
      expect(storedCruises).toHaveLength(1);
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.days[1].recipes).toHaveLength(1);
      expect(updatedCruise.days[1].recipes[0]).toEqual({
        originalRecipeId: 'recipe-1',
        recipeData
      });
    });

    it('should add a recipe reference without recipeData', () => {
      const cruise = createNewCruise('Test Cruise', 3, 2);
      cruise.id = 'test-cruise-1';
      setupCruises([cruise]);

      addRecipeToCruiseDay('test-cruise-1', 1, 'recipe-1');

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.days[0].recipes).toHaveLength(1);
      expect(updatedCruise.days[0].recipes[0]).toEqual({
        originalRecipeId: 'recipe-1',
        recipeData: undefined
      });
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      addRecipeToCruiseDay('nonexistent-cruise', 1, 'recipe-1');

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = createNewCruise('Test Cruise', 3, 2);
      cruise.id = 'test-cruise-1';
      setupCruises([cruise]);

      addRecipeToCruiseDay('test-cruise-1', 10, 'recipe-1');

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should copy recipe data when adding to cruise', () => {
      const cruise = createNewCruise('Test Cruise', 3, 2);
      cruise.id = 'test-cruise-1';
      setupCruises([cruise]);

      const originalRecipeData = createTestRecipe('recipe-1', 'Original Recipe');
      addRecipeToCruiseDay('test-cruise-1', 2, 'recipe-1', originalRecipeData);

      // Modify the original recipe data after adding to cruise
      originalRecipeData.name = 'Modified Recipe';
      originalRecipeData.ingredients[0].amount = 200;
      originalRecipeData.description = 'Modified description';
      originalRecipeData.instructions.push('Step 3');

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      var recipeInCruise = updatedCruise.days[1].recipes[0].recipeData;
      // Verify that the recipe data is copied
      expect(recipeInCruise).toBeDefined();
      expect(recipeInCruise).not.toBe(originalRecipeData);
      // Verify that the recipe data in the cruise was not affected by the modifications
      expect(recipeInCruise!.name).toBe('Original Recipe');
      expect(recipeInCruise!.ingredients[0].amount).toBe(100);
      expect(recipeInCruise!.description).toBe('Test recipe description');
      expect(recipeInCruise!.instructions).toHaveLength(2);
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

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.days[1].recipes).toHaveLength(1);
      expect(updatedCruise.days[1].recipes[0]).toEqual({
        originalRecipeId: 'recipe-2',
        recipeData: undefined
      });
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      removeRecipeFromCruiseDay('nonexistent-cruise', 1, 'recipe-1', 0);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = createNewCruise('Test Cruise', 3, 2);
      cruise.id = 'test-cruise-1';
      setupCruises([cruise]);

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

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.days[0].recipes).toHaveLength(0);
    });
  });
});
