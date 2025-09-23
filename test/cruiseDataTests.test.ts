import { getCruises, getCruiseById, saveCruise, deleteCruise, createNewCruise } from '../src/model/cruiseData';
import { Cruise } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock } from './cruiseTestHarness';

// Test utilities specific to this test file
const expectCruisesStored = (expectedCruises: Cruise[]) => {
  expect(localStorageMock.setItem).toHaveBeenCalledWith(
    'cyber-ochmistrz-cruises',
    JSON.stringify(expectedCruises)
  );
};

describe('cruiseData', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    clearCruises();
  });

  describe('createNewCruise', () => {
    it('should create a new cruise with correct properties', () => {
      const name = 'Test Cruise';
      const length = 5;
      const crew = 4;

      const cruise = createNewCruise(name, length, crew);

      expect(cruise).toBeDefined();
      expect(cruise.name).toBe(name);
      expect(cruise.length).toBe(length);
      expect(cruise.crew).toBe(crew);
      expect(cruise.id).toBeDefined();
      expect(cruise.dateCreated).toBeDefined();
      expect(cruise.dateModified).toBeDefined();
      expect(cruise.days).toHaveLength(length);
      expect(cruise.days[0].dayNumber).toBe(1);
      expect(cruise.days[0].recipes).toEqual([]);
      expect(cruise.days[length - 1].dayNumber).toBe(length);
    });
  });

  describe('saveCruise', () => {
    it('should save a new cruise to localStorage', () => {
      const cruise: Cruise = {
        id: 'test-cruise-1',
        name: 'Test Cruise',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: [
          { dayNumber: 1, recipes: [] },
          { dayNumber: 2, recipes: [] },
          { dayNumber: 3, recipes: [] }
        ]
      };

      saveCruise(cruise);

      expectCruisesStored([cruise]);
    });

    it('should update an existing cruise and modify dateModified', () => {
      const existingCruise: Cruise = {
        id: 'test-cruise-1',
        name: 'Original Name',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: [
          { dayNumber: 1, recipes: [] },
          { dayNumber: 2, recipes: [] },
          { dayNumber: 3, recipes: [] }
        ]
      };

      setupCruises([existingCruise]);

      const updatedCruise = { ...existingCruise, name: 'Updated Name' };
      saveCruise(updatedCruise);

      const storedCruises = getStoredCruises();
      expect(storedCruises).toHaveLength(1);
      expect(storedCruises[0].name).toBe('Updated Name');
      expect(storedCruises[0].dateModified).not.toBe(existingCruise.dateModified);
      expect(new Date(storedCruises[0].dateModified).getTime()).toBeGreaterThan(new Date(existingCruise.dateModified).getTime());
    });
  });

  describe('deleteCruise', () => {
    it('should delete a cruise from localStorage', () => {
      const cruise1: Cruise = {
        id: 'test-cruise-1',
        name: 'Cruise 1',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: []
      };

      const cruise2: Cruise = {
        id: 'test-cruise-2',
        name: 'Cruise 2',
        dateCreated: '2023-01-02T00:00:00.000Z',
        dateModified: '2023-01-02T00:00:00.000Z',
        length: 4,
        crew: 3,
        days: []
      };

      setupCruises([cruise1, cruise2]);

      deleteCruise('test-cruise-1');

      expectCruisesStored([cruise2]);
    });

    it('should do nothing if cruise to delete does not exist', () => {
      const cruise: Cruise = {
        id: 'test-cruise-1',
        name: 'Cruise 1',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: []
      };

      setupCruises([cruise]);

      deleteCruise('nonexistent-id');

      expectCruisesStored([cruise]);
    });
  });

  describe('getCruises', () => {
    it('should return empty array when no cruises in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const cruises = getCruises();
      expect(cruises).toEqual([]);
    });

    it('should return cruises from localStorage', () => {
      const cruise: Cruise = {
        id: 'test-cruise-1',
        name: 'Test Cruise',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify([cruise]));

      const cruises = getCruises();
      expect(cruises).toEqual([cruise]);
    });
  });

  describe('getCruiseById', () => {
    it('should return the cruise with the given id', () => {
      const cruise1: Cruise = {
        id: 'test-cruise-1',
        name: 'Cruise 1',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: []
      };

      const cruise2: Cruise = {
        id: 'test-cruise-2',
        name: 'Cruise 2',
        dateCreated: '2023-01-02T00:00:00.000Z',
        dateModified: '2023-01-02T00:00:00.000Z',
        length: 4,
        crew: 3,
        days: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify([cruise1, cruise2]));

      const result = getCruiseById('test-cruise-2');
      expect(result).toEqual(cruise2);
    });

    it('should return undefined if cruise not found', () => {
      const cruise: Cruise = {
        id: 'test-cruise-1',
        name: 'Cruise 1',
        dateCreated: '2023-01-01T00:00:00.000Z',
        dateModified: '2023-01-01T00:00:00.000Z',
        length: 3,
        crew: 2,
        days: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify([cruise]));

      const result = getCruiseById('nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
