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

// Import Cruise type for type safety
import { Cruise } from '../src/types';
