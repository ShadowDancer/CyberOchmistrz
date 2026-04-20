import { createNewCruise, updateCruiseDetails, willLengthReductionRemoveRecipes, addRecipeToCruiseDay, saveCruise } from '../src/model/cruiseData';
import { MealType } from '../src/types';
import { clearCruises, makeCrewMembers, createTestRecipe } from './cruiseTestHarness';

describe('cruise edit functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCruises();
  });

  describe('updateCruiseDetails', () => {
    it('should update cruise name, length, and crew', () => {
      const cruise = createNewCruise('Test Cruise', 5, makeCrewMembers(4));
      saveCruise(cruise);
      updateCruiseDetails(cruise.id, 'Updated Cruise', 7, makeCrewMembers(6));

      const { getCruiseById } = require('../src/model/cruiseData');
      const updatedCruise = getCruiseById(cruise.id);

      expect(updatedCruise?.name).toBe('Updated Cruise');
      expect(updatedCruise?.length).toBe(7);
      expect(updatedCruise?.crewMembers).toHaveLength(6);
      expect(updatedCruise?.days).toHaveLength(7);
    });

    it('should add days when length increases', () => {
      const cruise = createNewCruise('Test Cruise', 3, makeCrewMembers(4));
      saveCruise(cruise);
      updateCruiseDetails(cruise.id, 'Test Cruise', 5, makeCrewMembers(4));

      const { getCruiseById } = require('../src/model/cruiseData');
      const updatedCruise = getCruiseById(cruise.id);

      expect(updatedCruise?.days).toHaveLength(5);
      expect(updatedCruise?.days[3].dayNumber).toBe(4);
      expect(updatedCruise?.days[4].dayNumber).toBe(5);
      expect(updatedCruise?.days[4].recipes).toEqual([]);
    });

    it('should remove days when length decreases', () => {
      const cruise = createNewCruise('Test Cruise', 5, makeCrewMembers(4));
      saveCruise(cruise);
      updateCruiseDetails(cruise.id, 'Test Cruise', 3, makeCrewMembers(4));

      const { getCruiseById } = require('../src/model/cruiseData');
      const updatedCruise = getCruiseById(cruise.id);

      expect(updatedCruise?.days).toHaveLength(3);
      expect(updatedCruise?.days[2].dayNumber).toBe(3);
    });
  });

  describe('willLengthReductionRemoveRecipes', () => {
    it('should return false when length is not reduced', () => {
      const cruise = createNewCruise('Test Cruise', 5, makeCrewMembers(4));
      saveCruise(cruise);
      const result = willLengthReductionRemoveRecipes(cruise.id, 5);
      expect(result).toBe(false);
    });

    it('should return false when no recipes on days being removed', () => {
      const cruise = createNewCruise('Test Cruise', 5, makeCrewMembers(4));
      saveCruise(cruise);
      const result = willLengthReductionRemoveRecipes(cruise.id, 3);
      expect(result).toBe(false);
    });

    it('should return true when recipes exist on days being removed', () => {
      const cruise = createNewCruise('Test Cruise', 5, makeCrewMembers(4));
      saveCruise(cruise);
      const recipe1 = createTestRecipe('recipe1', 'Recipe 1');
      const recipe2 = createTestRecipe('recipe2', 'Recipe 2');
      addRecipeToCruiseDay(cruise.id, 4, 'recipe1', recipe1, 4, MealType.DINNER);
      addRecipeToCruiseDay(cruise.id, 5, 'recipe2', recipe2, 4, MealType.DINNER);

      const result = willLengthReductionRemoveRecipes(cruise.id, 3);
      expect(result).toBe(true);
    });
  });
});
