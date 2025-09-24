import { createNewCruise, reorderRecipesInCruiseDay } from '../src/model/cruiseData';
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

describe('CruiseReorderingRecipiesTests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    clearCruises();
  });

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
      setupCruises([cruise]);

      // Move recipe from index 0 to index 2 (should become: recipe-2, recipe-3, recipe-1)
      reorderRecipesInCruiseDay('test-cruise-1', 1, 0, 2);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.days[0].recipes).toHaveLength(3);
      expect(updatedCruise.days[0].recipes[0].originalRecipeId).toBe('recipe-2');
      expect(updatedCruise.days[0].recipes[1].originalRecipeId).toBe('recipe-3');
      expect(updatedCruise.days[0].recipes[2].originalRecipeId).toBe('recipe-1');
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      reorderRecipesInCruiseDay('nonexistent-cruise', 1, 0, 1);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });
      setupCruises([cruise]);

      reorderRecipesInCruiseDay('test-cruise-1', 10, 0, 1);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if fromIndex is out of bounds', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });
      setupCruises([cruise]);

      reorderRecipesInCruiseDay('test-cruise-1', 1, 5, 0);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if toIndex is out of bounds', () => {
      const cruise = createCruiseWithRecipes('test-cruise-1', 'Test Cruise', 3, {
        1: [{ recipeId: 'recipe-1' }]
      });
      setupCruises([cruise]);

      reorderRecipesInCruiseDay('test-cruise-1', 1, 0, 5);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});
