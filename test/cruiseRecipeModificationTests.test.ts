import {
  createNewCruise,
  addRecipeToCruiseDay,
  updateRecipeIngredientInCruise,
  addIngredientToRecipeInCruise,
  removeIngredientFromRecipeInCruise
} from '../src/model/cruiseData';
import { Cruise, Recipie, MealType } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock } from './cruiseTestHarness';

// Realistic test data based on actual recipes and supplies
const realisticJajecznicaRecipe: Recipie = {
  id: "jajecznica",
  name: "Jajecznica",
  description: "Pyszna. Na jachcie może być konieczność robienia na 2 tury.",
  mealType: ["śniadanie" as MealType, "kolacja" as MealType],
  difficulty: 3,
  ingredients: [
    { id: "jajka", amount: 3 },
    { id: "sol", amount: 1 },
    { id: "pieprz", amount: 1 },
    { id: "chleb", amount: 0.15 },
    { id: "maslo", amount: 2 }
  ],
  instructions: ["Każdy umie zrobić jajecznicę."],
  developedBy: "Przemysław Onak"
};

const realisticPestoRecipe: Recipie = {
  id: "pesto-z-tuczykiem",
  name: "Pesto z tuńczykiem",
  description: "Szybkie i dobre, łatwo zrobić nawet na fali. Zamiast zielonego pesto można użyć czerwonego.",
  mealType: ["obiad" as MealType],
  difficulty: 2,
  ingredients: [
    { id: "tunczyk_w_sosie_wlasnym", amount: 75 },
    { id: "makaron_penne", amount: 90 },
    { id: "pesto", amount: 40 }
  ],
  instructions: [
    "Gotujemy i cedzimy makaron",
    "Dodajemy tuńczyka i pesto, mieszamy"
  ],
  developedBy: "Przemysław Onak"
};

// Helper to create a cruise with recipes on specific days
const createCruiseWithRecipes = (id: string, name: string, length: number, recipesByDay: { [dayNumber: number]: { recipeId: string; recipeData?: Recipie }[] }): Cruise => {
  const cruise = createNewCruise(name, length, 4); // 4 crew members for realistic cruise
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

describe('cruiseRecipeModification', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    clearCruises();
  });

  describe('updateRecipeIngredientInCruise', () => {
    it('should update ingredient amount in a cruise recipe', () => {
      // Create cruise with jajecznica recipe on day 1
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      // Update the amount of eggs from 3 to 6 (for 4 crew members)
      updateRecipeIngredientInCruise('rejs-na-mazury-2024', 1, 0, 0, 6);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      const recipeInCruise = updatedCruise.days[0].recipes[0];

      expect(recipeInCruise.recipeData?.ingredients[0].amount).toBe(6); // eggs updated
      expect(recipeInCruise.recipeData?.ingredients[0].id).toBe('jajka');
      // Other ingredients should remain unchanged
      expect(recipeInCruise.recipeData?.ingredients[1].amount).toBe(1); // salt unchanged
    });

    it('should not modify the original recipe data', () => {
      const originalRecipe = { ...realisticJajecznicaRecipe };
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      // Modify eggs amount in cruise
      updateRecipeIngredientInCruise('rejs-na-mazury-2024', 1, 0, 0, 8);

      // Original recipe should remain unchanged
      expect(originalRecipe.ingredients[0].amount).toBe(3);
      expect(realisticJajecznicaRecipe.ingredients[0].amount).toBe(3);
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      updateRecipeIngredientInCruise('nonexistent-cruise', 1, 0, 0, 6);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      updateRecipeIngredientInCruise('rejs-na-mazury-2024', 10, 0, 0, 6);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if recipe index is invalid', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      updateRecipeIngredientInCruise('rejs-na-mazury-2024', 1, 5, 0, 6);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if ingredient index is invalid', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      updateRecipeIngredientInCruise('rejs-na-mazury-2024', 1, 0, 10, 6);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('addIngredientToRecipeInCruise', () => {
    it('should add a new ingredient to a cruise recipe', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        2: [{ recipeId: 'pesto-z-tuczykiem', recipeData: realisticPestoRecipe }]
      });
      setupCruises([cruise]);

      // Add parmesan cheese to the pesto recipe
      addIngredientToRecipeInCruise('rejs-na-mazury-2024', 2, 0, 'parmezan', 20);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      const recipeInCruise = updatedCruise.days[1].recipes[0];

      expect(recipeInCruise.recipeData?.ingredients).toHaveLength(4); // Original 3 + 1 new
      const newIngredient = recipeInCruise.recipeData?.ingredients[3];
      expect(newIngredient?.id).toBe('parmezan');
      expect(newIngredient?.amount).toBe(20);
    });

    it('should initialize ingredients array if it does not exist', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica' }] // No recipeData
      });
      setupCruises([cruise]);

      // This should do nothing since there's no recipeData
      addIngredientToRecipeInCruise('rejs-na-mazury-2024', 1, 0, 'parmezan', 20);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should not modify the original recipe data', () => {
      const originalRecipe = { ...realisticPestoRecipe };
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        2: [{ recipeId: 'pesto-z-tuczykiem', recipeData: realisticPestoRecipe }]
      });
      setupCruises([cruise]);

      // Add ingredient to cruise version
      addIngredientToRecipeInCruise('rejs-na-mazury-2024', 2, 0, 'cebula', 50);

      // Original recipe should remain unchanged
      expect(originalRecipe.ingredients).toHaveLength(3);
      expect(realisticPestoRecipe.ingredients).toHaveLength(3);
    });
  });

  describe('removeIngredientFromRecipeInCruise', () => {
    it('should remove an ingredient from a cruise recipe', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      // Remove bread from jajecznica (index 3)
      removeIngredientFromRecipeInCruise('rejs-na-mazury-2024', 1, 0, 3);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      const recipeInCruise = updatedCruise.days[0].recipes[0];

      expect(recipeInCruise.recipeData?.ingredients).toHaveLength(4); // Original 5 - 1 removed
      // Check that bread (chleb) is no longer in ingredients
      const breadIngredient = recipeInCruise.recipeData?.ingredients.find(ing => ing.id === 'chleb');
      expect(breadIngredient).toBeUndefined();
    });

    it('should not modify the original recipe data', () => {
      const originalRecipe = { ...realisticJajecznicaRecipe };
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      // Remove bread from cruise version
      removeIngredientFromRecipeInCruise('rejs-na-mazury-2024', 1, 0, 3);

      // Original recipe should still have bread
      expect(originalRecipe.ingredients).toHaveLength(5);
      expect(originalRecipe.ingredients[3].id).toBe('chleb');
      expect(realisticJajecznicaRecipe.ingredients).toHaveLength(5);
    });

    it('should do nothing if ingredient index is invalid', () => {
      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }]
      });
      setupCruises([cruise]);

      removeIngredientFromRecipeInCruise('rejs-na-mazury-2024', 1, 0, 10);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('recipe isolation - original recipes remain unchanged', () => {
    it('should keep original recipes intact when modifying cruise versions', () => {
      const originalJajecznica = JSON.parse(JSON.stringify(realisticJajecznicaRecipe));
      const originalPesto = JSON.parse(JSON.stringify(realisticPestoRecipe));

      const cruise = createCruiseWithRecipes('rejs-na-mazury-2024', 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }],
        2: [{ recipeId: 'pesto-z-tuczykiem', recipeData: realisticPestoRecipe }]
      });
      setupCruises([cruise]);

      // Modify both recipes in the cruise
      updateRecipeIngredientInCruise('rejs-na-mazury-2024', 1, 0, 0, 12); // More eggs
      addIngredientToRecipeInCruise('rejs-na-mazury-2024', 2, 0, 'parmezan', 25); // Add cheese
      removeIngredientFromRecipeInCruise('rejs-na-mazury-2024', 1, 0, 3); // Remove bread

      // Original recipes should be completely unchanged
      expect(realisticJajecznicaRecipe).toEqual(originalJajecznica);
      expect(realisticPestoRecipe).toEqual(originalPesto);

      // Verify the modifications are only in the cruise
      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      const jajecznicaInCruise = updatedCruise.days[0].recipes[0].recipeData!;
      const pestoInCruise = updatedCruise.days[1].recipes[0].recipeData!;

      expect(jajecznicaInCruise.ingredients[0].amount).toBe(12); // Modified
      expect(jajecznicaInCruise.ingredients).toHaveLength(4); // Bread removed
      expect(pestoInCruise.ingredients).toHaveLength(4); // Cheese added
      expect(pestoInCruise.ingredients[3].id).toBe('parmezan');
    });
  });
});
