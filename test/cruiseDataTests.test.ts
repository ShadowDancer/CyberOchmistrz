import { getCruises, getCruiseById, saveCruise, deleteCruise, createNewCruise } from '../src/model/cruiseData';
import { Cruise } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock } from './cruiseTestHarness';

describe('cruiseData', () => {
  const makeCruise = (overrides?: Partial<Cruise>): Cruise => ({
    id: 'test-cruise-1',
    name: 'Test Cruise',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateModified: '2023-01-01T00:00:00.000Z',
    length: 3,
    crew: 2,
    days: [],
    ...overrides,
  });

  const expectCruisesStored = (expectedCruises: Cruise[]) => {
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cyber-ochmistrz-cruises',
      JSON.stringify(expectedCruises)
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearCruises();
  });

  describe('createNewCruise', () => {
    it('should create a new cruise with correct properties', () => {
      const cruise = createNewCruise('Test Cruise', 5, 4);

      expect(cruise).toEqual(expect.objectContaining({
        name: 'Test Cruise',
        length: 5,
        crew: 4,
      }));
      expect(cruise.id).toBeDefined();
      expect(cruise.dateCreated).toBeDefined();
      expect(cruise.dateModified).toBeDefined();
      expect(cruise.days).toHaveLength(5);
      expect(cruise.days[0]).toEqual(expect.objectContaining({ dayNumber: 1, recipes: [] }));
      expect(cruise.days[4].dayNumber).toBe(5);
    });
  });

  describe('saveCruise', () => {
    it('should save a new cruise to localStorage', () => {
      const cruise = makeCruise({
        days: [
          { dayNumber: 1, recipes: [] },
          { dayNumber: 2, recipes: [] },
          { dayNumber: 3, recipes: [] },
        ],
      });

      saveCruise(cruise);

      expectCruisesStored([cruise]);
    });

    it('should update an existing cruise and modify dateModified', () => {
      const existingCruise = makeCruise({
        name: 'Original Name',
        days: [
          { dayNumber: 1, recipes: [] },
          { dayNumber: 2, recipes: [] },
          { dayNumber: 3, recipes: [] },
        ],
      });
      setupCruises([existingCruise]);

      saveCruise({ ...existingCruise, name: 'Updated Name' });

      const stored = getStoredCruises();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Updated Name');
      expect(stored[0].dateModified).not.toBe(existingCruise.dateModified);
      expect(new Date(stored[0].dateModified).getTime()).toBeGreaterThan(new Date(existingCruise.dateModified).getTime());
    });
  });

  describe('deleteCruise', () => {
    it('should delete a cruise from localStorage', () => {
      const cruise1 = makeCruise();
      const cruise2 = makeCruise({ id: 'test-cruise-2', name: 'Cruise 2', dateCreated: '2023-01-02T00:00:00.000Z', dateModified: '2023-01-02T00:00:00.000Z', length: 4, crew: 3 });
      setupCruises([cruise1, cruise2]);

      deleteCruise('test-cruise-1');

      expectCruisesStored([cruise2]);
    });

    it('should do nothing if cruise to delete does not exist', () => {
      const cruise = makeCruise();
      setupCruises([cruise]);

      deleteCruise('nonexistent-id');

      expectCruisesStored([cruise]);
    });
  });

  describe('getCruises', () => {
    it('should return empty array when no cruises in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(getCruises()).toEqual([]);
    });

    it('should return cruises from localStorage', () => {
      const cruise = makeCruise();
      localStorageMock.getItem.mockReturnValue(JSON.stringify([cruise]));

      expect(getCruises()).toEqual([cruise]);
    });
  });

  describe('getCruiseById', () => {
    it('should return the cruise with the given id', () => {
      const cruise1 = makeCruise();
      const cruise2 = makeCruise({ id: 'test-cruise-2', name: 'Cruise 2', dateCreated: '2023-01-02T00:00:00.000Z', dateModified: '2023-01-02T00:00:00.000Z', length: 4, crew: 3 });
      localStorageMock.getItem.mockReturnValue(JSON.stringify([cruise1, cruise2]));

      expect(getCruiseById('test-cruise-2')).toEqual(cruise2);
    });

    it('should return undefined if cruise not found', () => {
      const cruise = makeCruise();
      localStorageMock.getItem.mockReturnValue(JSON.stringify([cruise]));

      expect(getCruiseById('nonexistent')).toBeUndefined();
    });
  });
});
