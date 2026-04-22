// Mock localStorage with storage
let storage: { [key: string]: string } = {};
export const localStorageMock = {
  getItem: jest.fn((key: string) => storage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete storage[key];
  }),
  clear: jest.fn(() => {
    storage = {};
  }),
  length: 0,
  key: jest.fn(),
};

// Mock window object for tests
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock
  },
  writable: true
});

// Also assign to global for direct access
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Test utilities for cleaner API
export const setupCruises = (cruises: Cruise[]) => {
  storage['cyber-ochmistrz-cruises'] = JSON.stringify(cruises);
};

export const clearCruises = () => {
  delete storage['cyber-ochmistrz-cruises'];
};

export const getStoredCruises = (): Cruise[] => {
  const calls = localStorageMock.setItem.mock.calls.filter(call => call[0] === 'cyber-ochmistrz-cruises');
  const lastCall = calls[calls.length - 1];
  return lastCall ? JSON.parse(lastCall[1]) : [];
};

import { Cruise, CrewMember, Recipie, MealType, IngredientAmount } from '../src/types';
import { createNewCruise } from '../src/model/cruiseData';
import { createRecipie } from '../src/model/recipieData';

export const makeCrewMembers = (count: number, tags: string[] = ['omnivore']): CrewMember[] =>
  Array.from({ length: count }, (_, i) => ({ id: `crew-${i}`, tags }));

export const createTestRecipe = (id: string, name: string, ingredients?: IngredientAmount[]): Recipie =>
  createRecipie({
    id,
    name,
    ingredients: ingredients ?? [{ id: 'test-ingredient', amount: 100 }],
    description: 'Test recipe description',
    mealType: [MealType.DINNER],
    difficulty: 2,
    instructions: ['Step 1', 'Step 2'],
    developedBy: 'Test Chef'
  });

export const createCruiseWithRecipes = (
  id: string,
  name: string,
  length: number,
  recipesByDay: { [dayNumber: number]: { recipeId: string; recipeData?: Recipie; crewCount?: number; mealSlot?: MealType }[] },
  crewMembers: CrewMember[] = makeCrewMembers(2)
): Cruise => {
  const cruise = createNewCruise(name, length, crewMembers);
  cruise.id = id;

  Object.entries(recipesByDay).forEach(([dayNum, recipes]) => {
    const dayIndex = cruise.days.findIndex(d => d.dayNumber === parseInt(dayNum));
    if (dayIndex >= 0) {
      cruise.days[dayIndex].recipes = recipes.map(r => ({
        originalRecipeId: r.recipeId,
        recipeData: r.recipeData ?? createTestRecipe(r.recipeId, r.recipeId),
        crewCount: r.crewCount ?? crewMembers.length,
        mealSlot: r.mealSlot ?? MealType.DINNER,
      }));
    }
  });

  return cruise;
};
