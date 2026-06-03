import { Cruise } from '../src/model/cruise';
import { getCruises, getCruiseById, saveCruise, deleteCruise } from '../src/model/cruiseData';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock, makeCrewMembers } from './cruiseTestHarness';

describe('cruiseData', () => {
  // createNew auto-generates id/dates; spread overrides on top so tests can pin a
  // deterministic id (default 'test-cruise-1'). The result is a plain Cruise-shaped
  // object, matching how cruises come back from localStorage (JSON, no methods).
  const makeCruise = (overrides?: Partial<Cruise>): Cruise => {
    const base = Cruise.createNew(
      overrides?.name ?? 'Test Cruise',
      overrides?.days?.length ?? 3,
      overrides?.crewMembers?.slice() ?? makeCrewMembers(2),
      overrides?.days?.slice(),
      overrides?.additionalSupplies?.slice(),
      '2030-06-01');
    return { ...base, id: 'test-cruise-1', ...overrides } as Cruise;
  };

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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createNewCruise', () => {
    it('should create a new cruise with correct properties', () => {
      const crew = makeCrewMembers(4);
      const cruise = Cruise.createNew('Test Cruise', 5, crew);

      expect(cruise).toEqual(expect.objectContaining({
        name: 'Test Cruise',
        crewMembers: crew,
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
      // Fake timers so dateModified provably advances between create and update
      // (both calls would otherwise land in the same millisecond).
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2030-06-01T00:00:00.000Z'));

      // Real instance (not makeCruise) because this test calls updateCruiseDetails.
      const initialCruise = Cruise.createNew('Original Name', 3, makeCrewMembers(2), undefined, undefined, '2030-06-01');
      setupCruises([initialCruise]);

      jest.setSystemTime(new Date('2030-06-01T00:00:01.000Z')); // +1s
      const updatedCruise = initialCruise.updateCruiseDetails('Updated Name', initialCruise.days.length, initialCruise.crewMembers.slice());
      saveCruise(updatedCruise);

      const stored = getStoredCruises();

      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Updated Name');
      expect(stored[0].dateModified).not.toBe(initialCruise.dateModified);
      expect(new Date(stored[0].dateModified).getTime()).toBeGreaterThan(new Date(initialCruise.dateModified).getTime());
    });
  });

  describe('deleteCruise', () => {
    it('should delete a cruise from localStorage', () => {
      const cruise1 = makeCruise();
      const cruise2 = makeCruise({ id: 'test-cruise-2', name: 'Cruise 2', dateCreated: '2023-01-02T00:00:00.000Z', dateModified: '2023-01-02T00:00:00.000Z', crewMembers: makeCrewMembers(3) });
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
      const cruise2 = makeCruise({ id: 'test-cruise-2', name: 'Cruise 2', dateCreated: '2023-01-02T00:00:00.000Z', dateModified: '2023-01-02T00:00:00.000Z', crewMembers: makeCrewMembers(3) });
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
