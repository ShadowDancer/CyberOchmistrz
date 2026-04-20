import {
  createNewCruise,
  addRecipeToCruiseDay,
  updateRecipeIngredientInCruise,
  addIngredientToRecipeInCruise,
  removeIngredientFromRecipeInCruise
} from '../src/model/cruiseData';
import { Recipie, MealType } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock, createCruiseWithRecipes, makeCrewMembers } from './cruiseTestHarness';

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

describe('cruiseRecipeModification', () => {
  const ID = 'rejs-na-mazury-2024';

  const getUpdatedCruise = () => getStoredCruises()[0];

  const setupJajecznica = (day = 1) =>
    createCruiseWithRecipes(ID, 'Rejs na Mazury 2024', 7, { [day]: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }] }, makeCrewMembers(4));

  const setupPesto = (day = 2) =>
    createCruiseWithRecipes(ID, 'Rejs na Mazury 2024', 7, { [day]: [{ recipeId: 'pesto-z-tuczykiem', recipeData: realisticPestoRecipe }] }, makeCrewMembers(4));

  beforeEach(() => {
    jest.clearAllMocks();
    clearCruises();
  });

  describe('updateRecipeIngredientInCruise', () => {
    it('should update ingredient amount in a cruise recipe', () => {
      setupCruises([setupJajecznica()]);

      updateRecipeIngredientInCruise(ID, 1, 0, 0, 6);

      const recipe = getUpdatedCruise().days[0].recipes[0].recipeData!;
      expect(recipe.ingredients[0]).toEqual(expect.objectContaining({ id: 'jajka', amount: 6 }));
      expect(recipe.ingredients[1].amount).toBe(1);
    });

    it('should not modify the original recipe data', () => {
      const originalRecipe = { ...realisticJajecznicaRecipe };
      setupCruises([setupJajecznica()]);

      updateRecipeIngredientInCruise(ID, 1, 0, 0, 8);

      expect(originalRecipe.ingredients[0].amount).toBe(3);
      expect(realisticJajecznicaRecipe.ingredients[0].amount).toBe(3);
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);
      updateRecipeIngredientInCruise(ID, 1, 0, 0, 6);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if day number is invalid', () => {
      setupCruises([setupJajecznica()]);
      updateRecipeIngredientInCruise(ID, 10, 0, 0, 6);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if recipe index is invalid', () => {
      setupCruises([setupJajecznica()]);
      updateRecipeIngredientInCruise(ID, 1, 5, 0, 6);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if ingredient index is invalid', () => {
      setupCruises([setupJajecznica()]);
      updateRecipeIngredientInCruise(ID, 1, 0, 10, 6);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('addIngredientToRecipeInCruise', () => {
    it('should add a new ingredient to a cruise recipe', () => {
      setupCruises([setupPesto()]);

      addIngredientToRecipeInCruise(ID, 2, 0, 'parmezan', 20);

      const recipe = getUpdatedCruise().days[1].recipes[0].recipeData!;
      expect(recipe.ingredients).toHaveLength(4);
      expect(recipe.ingredients[3]).toEqual(expect.objectContaining({ id: 'parmezan', amount: 20 }));
    });

    it('should add an ingredient even when recipe was added without explicit recipeData', () => {
      const cruise = createCruiseWithRecipes(ID, 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica' }]
      }, makeCrewMembers(4));
      setupCruises([cruise]);

      addIngredientToRecipeInCruise(ID, 1, 0, 'parmezan', 20);

      const recipe = getStoredCruises()[0].days[0].recipes[0].recipeData;
      expect(recipe).toBeDefined();
      expect(recipe.ingredients.find(i => i.id === 'parmezan')).toEqual(expect.objectContaining({ id: 'parmezan', amount: 20 }));
    });

    it('should not modify the original recipe data', () => {
      const originalRecipe = { ...realisticPestoRecipe };
      setupCruises([setupPesto()]);

      addIngredientToRecipeInCruise(ID, 2, 0, 'cebula', 50);

      expect(originalRecipe.ingredients).toHaveLength(3);
      expect(realisticPestoRecipe.ingredients).toHaveLength(3);
    });
  });

  describe('removeIngredientFromRecipeInCruise', () => {
    it('should remove an ingredient from a cruise recipe', () => {
      setupCruises([setupJajecznica()]);

      removeIngredientFromRecipeInCruise(ID, 1, 0, 3);

      const recipe = getUpdatedCruise().days[0].recipes[0].recipeData!;
      expect(recipe.ingredients).toHaveLength(4);
      expect(recipe.ingredients.find(ing => ing.id === 'chleb')).toBeUndefined();
    });

    it('should not modify the original recipe data', () => {
      const originalRecipe = { ...realisticJajecznicaRecipe };
      setupCruises([setupJajecznica()]);

      removeIngredientFromRecipeInCruise(ID, 1, 0, 3);

      expect(originalRecipe.ingredients).toHaveLength(5);
      expect(originalRecipe.ingredients[3].id).toBe('chleb');
      expect(realisticJajecznicaRecipe.ingredients).toHaveLength(5);
    });

    it('should do nothing if ingredient index is invalid', () => {
      setupCruises([setupJajecznica()]);
      removeIngredientFromRecipeInCruise(ID, 1, 0, 10);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('recipe isolation - original recipes remain unchanged', () => {
    it('should keep original recipes intact when modifying cruise versions', () => {
      const originalJajecznica = JSON.parse(JSON.stringify(realisticJajecznicaRecipe));
      const originalPesto = JSON.parse(JSON.stringify(realisticPestoRecipe));

      const cruise = createCruiseWithRecipes(ID, 'Rejs na Mazury 2024', 7, {
        1: [{ recipeId: 'jajecznica', recipeData: realisticJajecznicaRecipe }],
        2: [{ recipeId: 'pesto-z-tuczykiem', recipeData: realisticPestoRecipe }]
      }, makeCrewMembers(4));
      setupCruises([cruise]);

      updateRecipeIngredientInCruise(ID, 1, 0, 0, 12);
      addIngredientToRecipeInCruise(ID, 2, 0, 'parmezan', 25);
      removeIngredientFromRecipeInCruise(ID, 1, 0, 3);

      expect(realisticJajecznicaRecipe).toEqual(originalJajecznica);
      expect(realisticPestoRecipe).toEqual(originalPesto);

      const updated = getUpdatedCruise();
      const jajInCruise = updated.days[0].recipes[0].recipeData!;
      const pestoInCruise = updated.days[1].recipes[0].recipeData!;

      expect(jajInCruise.ingredients[0].amount).toBe(12);
      expect(jajInCruise.ingredients).toHaveLength(4);
      expect(pestoInCruise.ingredients).toHaveLength(4);
      expect(pestoInCruise.ingredients[3].id).toBe('parmezan');
    });
  });
});
