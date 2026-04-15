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

import { Cruise, Recipie, MealType, IngredientAmount } from '../src/types';
import { createNewCruise } from '../src/model/cruiseData';

export const createTestRecipe = (id: string, name: string, ingredients?: IngredientAmount[]): Recipie => ({
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
  recipesByDay: { [dayNumber: number]: { recipeId: string; recipeData?: Recipie }[] },
  crew = 2
): Cruise => {
  const cruise = createNewCruise(name, length, crew);
  cruise.id = id;

  Object.entries(recipesByDay).forEach(([dayNum, recipes]) => {
    const dayIndex = cruise.days.findIndex(d => d.dayNumber === parseInt(dayNum));
    if (dayIndex >= 0) {
      cruise.days[dayIndex].recipes = recipes.map(r => ({
        originalRecipeId: r.recipeId,
        recipeData: r.recipeData
      }));
    }
  });

  return cruise;
};
