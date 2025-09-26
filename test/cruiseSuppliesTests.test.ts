import {
  createNewCruise,
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise,
  groupAdditionalSuppliesByCategory
} from '../src/model/cruiseData';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock } from './cruiseTestHarness';

describe('cruiseSupplies', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    clearCruises();
  });

  describe('addAdditionalSupplyToCruise', () => {
    it('should add a new non-ingredient supply to a cruise', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      setupCruises([cruise]);

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'papier_toaletowy', 7, false, false); // 7 rolls for 7 days

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'papier_toaletowy',
        amount: 7,
        isPerPerson: false,
        isPerDay: false
      });
    });

    it('should add to amount if supply already exists', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [{ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false }];
      setupCruises([cruise]);

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 15, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'woda_butelkowana',
        amount: 25, // 10 + 15
        isPerPerson: false,
        isPerDay: false
      });
    });

    it('should merge amounts when calling addAdditionalSupplyToCruise multiple times', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      setupCruises([cruise]);

      // Add water bottles multiple times
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 5, false, false);
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 10, false, false);
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 8, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'woda_butelkowana',
        amount: 23,
        isPerPerson: false,
        isPerDay: false
      });
    });

    it('should initialize additionalSupplies array if it does not exist', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      // No additionalSupplies initially
      setupCruises([cruise]);

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'mydło', 4, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'mydło',
        amount: 4,
        isPerPerson: false,
        isPerDay: false
      });
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      addAdditionalSupplyToCruise('nonexistent-cruise', 'papier_toaletowy', 7, false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('updateAdditionalSupplyAmount', () => {
    it('should update the amount of an existing supply', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [
        { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
        { id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false }
      ];
      setupCruises([cruise]);

      // Update toilet paper amount
      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(2);
      const toiletPaper = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && !s.isPerPerson && !s.isPerDay);
      expect(toiletPaper?.amount).toBe(10);
      // Other supplies should remain unchanged
      const water = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana');
      expect(water?.amount).toBe(20);
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      updateAdditionalSupplyAmount('nonexistent-cruise', 'papier_toaletowy', 10, false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should add new entry if cruise has no additional supplies', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      // No additionalSupplies
      setupCruises([cruise]);

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'papier_toaletowy',
        amount: 10,
        isPerPerson: false,
        isPerDay: false
      });
    });

    it('should add new entry if supply does not exist', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [{ id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false }];
      setupCruises([cruise]);

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(2);
      const toiletPaper = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy');
      expect(toiletPaper).toEqual({
        id: 'papier_toaletowy',
        amount: 10,
        isPerPerson: false,
        isPerDay: false
      });
      // Original supply should remain
      const water = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana');
      expect(water?.amount).toBe(20);
    });
  });

  describe('removeAdditionalSupplyFromCruise', () => {
    it('should remove a supply from the cruise', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [
        { id: 'papier_toaletowy', amount: 7, isPerPerson: false, isPerDay: false },
        { id: 'woda_butelkowana', amount: 28, isPerPerson: false, isPerDay: false },
        { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false }
      ];
      setupCruises([cruise]);

      // Remove soap
      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło', false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(2);
      const soap = updatedCruise.additionalSupplies!.find(s => s.id === 'mydło');
      expect(soap).toBeUndefined();
      // Other supplies should remain
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy')).toBeDefined();
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana')).toBeDefined();
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      removeAdditionalSupplyFromCruise('nonexistent-cruise', 'mydło', false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if cruise has no additional supplies', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      // No additionalSupplies
      setupCruises([cruise]);

      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło', false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle case when supply does not exist', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [{ id: 'woda_butelkowana', amount: 28, isPerPerson: false, isPerDay: false }];
      setupCruises([cruise]);

      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło', false, false);

      // setItem is called (saveCruise is always called), but the array should remain unchanged
      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0].id).toBe('woda_butelkowana');
    });
  });

  describe('groupAdditionalSuppliesByCategory', () => {
    it('should group additional supplies by category', () => {
      const cruise = createNewCruise('Test Cruise', 5, 3);
      cruise.id = 'test-cruise';
      cruise.additionalSupplies = [
        { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
        { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
        { id: 'mydło', amount: 3, isPerPerson: false, isPerDay: false },
        { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false }
      ];
      setupCruises([cruise]);

      const grouped = groupAdditionalSuppliesByCategory('test-cruise');

      expect(Array.isArray(grouped)).toBe(true);
      expect(grouped).toHaveLength(2);

      const napojeGroup = grouped.find(g => g.category === 'napoje');
      expect(napojeGroup).toBeDefined();
      expect(napojeGroup!.supplies).toHaveLength(2);

      const srodkiGroup = grouped.find(g => g.category === 'środki czystości');
      expect(srodkiGroup).toBeDefined();
      expect(srodkiGroup!.supplies).toHaveLength(2);
    });

    it('should return empty array for cruise with no additional supplies', () => {
      const cruise = createNewCruise('Empty Cruise', 3, 2);
      cruise.id = 'empty-cruise';
      setupCruises([cruise]);

      const grouped = groupAdditionalSuppliesByCategory('empty-cruise');

      expect(grouped).toEqual([]);
    });

    it('should sort categories alphabetically', () => {
      const cruise = createNewCruise('Sort Test Cruise', 1, 1);
      cruise.id = 'sort-test-cruise';
      cruise.additionalSupplies = [
        { id: 'mydło', amount: 1, isPerPerson: false, isPerDay: false },
        { id: 'woda_butelkowana', amount: 1, isPerPerson: false, isPerDay: false },
        { id: 'herbata', amount: 1, isPerPerson: false, isPerDay: false }
      ];
      setupCruises([cruise]);

      const grouped = groupAdditionalSuppliesByCategory('sort-test-cruise');

      expect(grouped).toHaveLength(2);
      expect(grouped[0].category).toBe('napoje');
      expect(grouped[1].category).toBe('środki czystości');
    });

    it('should handle supplies with different flag combinations separately and sort by flag priority', () => {
      const cruise = createNewCruise('Flag Test Cruise', 7, 4);
      cruise.id = 'flag-test-cruise';
      cruise.additionalSupplies = [
        { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: true },   // priority 3
        { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false }, // priority 0
        { id: 'woda_butelkowana', amount: 3, isPerPerson: false, isPerDay: true },   // priority 2
        { id: 'woda_butelkowana', amount: 5, isPerPerson: true, isPerDay: false }    // priority 1
      ];
      setupCruises([cruise]);

      const grouped = groupAdditionalSuppliesByCategory('flag-test-cruise');

      const napojeGroup = grouped.find(g => g.category === 'napoje');
      expect(napojeGroup!.supplies).toHaveLength(4);

      // Check that supplies are sorted by flag priority: fixed -> per person -> per day -> per person per day
      expect(napojeGroup!.supplies[0].amount).toBe(10); // fixed (priority 0)
      expect(napojeGroup!.supplies[0].isPerPerson).toBe(false);
      expect(napojeGroup!.supplies[0].isPerDay).toBe(false);

      expect(napojeGroup!.supplies[1].amount).toBe(5); // per person (priority 1)
      expect(napojeGroup!.supplies[1].isPerPerson).toBe(true);
      expect(napojeGroup!.supplies[1].isPerDay).toBe(false);

      expect(napojeGroup!.supplies[2].amount).toBe(3); // per day (priority 2)
      expect(napojeGroup!.supplies[2].isPerPerson).toBe(false);
      expect(napojeGroup!.supplies[2].isPerDay).toBe(true);

      expect(napojeGroup!.supplies[3].amount).toBe(2); // per person per day (priority 3)
      expect(napojeGroup!.supplies[3].isPerPerson).toBe(true);
      expect(napojeGroup!.supplies[3].isPerDay).toBe(true);
    });

    it('should return empty array for non-existent cruise', () => {
      setupCruises([]);

      const grouped = groupAdditionalSuppliesByCategory('non-existent-cruise');

      expect(grouped).toEqual([]);
    });
  });

  describe('realistic cruise supplies management', () => {
    it('should demonstrate typical cruise supply operations', () => {
      // Use storage-based approach for this test
      const cruise = createNewCruise('Żeglarski Rejs Bałtycki 2024', 10, 6);
      cruise.id = 'zeglarski-rejs-baltycki-2024';
      cruise.additionalSupplies = [
        { id: 'woda_butelkowana', amount: 60, isPerPerson: false, isPerDay: false },
        { id: 'papier_toaletowy', amount: 15, isPerPerson: false, isPerDay: false },
        { id: 'mydło', amount: 6, isPerPerson: false, isPerDay: false },
        { id: 'płyn_do_naczyń', amount: 2, isPerPerson: false, isPerDay: false },
        { id: 'worki_na_śmieci_120L', amount: 20, isPerPerson: false, isPerDay: false },
        { id: 'worki_na_śmieci_30L', amount: 30, isPerPerson: false, isPerDay: false },
        { id: 'ręcznik_papierowy', amount: 5, isPerPerson: false, isPerDay: false },
        { id: 'zapalniczka', amount: 3, isPerPerson: false, isPerDay: false },
        { id: 'herbata', amount: 20, isPerPerson: false, isPerDay: false },
        { id: 'kawa', amount: 200, isPerPerson: false, isPerDay: false }
      ];
      // Set initial storage directly
      let storage: { [key: string]: string } = {};
      storage['cyber-ochmistrz-cruises'] = JSON.stringify([cruise]);
      localStorageMock.getItem.mockImplementation((key: string) => storage[key] || null);
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        storage[key] = value;
      });

      // Update some amounts based on actual needs
      updateAdditionalSupplyAmount('zeglarski-rejs-baltycki-2024', 'woda_butelkowana', 80, false, false); // Need more water
      updateAdditionalSupplyAmount('zeglarski-rejs-baltycki-2024', 'papier_toaletowy', 20, false, false); // Need more toilet paper

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana')?.amount).toBe(80);
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy')?.amount).toBe(20);

      // Remove items that are no longer needed
      removeAdditionalSupplyFromCruise('zeglarski-rejs-baltycki-2024', 'ręcznik_papierowy', false, false); // Not needed
      removeAdditionalSupplyFromCruise('zeglarski-rejs-baltycki-2024', 'zapalniczka', false, false); // Not needed

      const finalStoredCruises = getStoredCruises();
      const finalCruise = finalStoredCruises[0];
      expect(finalCruise.additionalSupplies).toHaveLength(8);
      expect(finalCruise.additionalSupplies!.find(s => s.id === 'ręcznik_papierowy')).toBeUndefined();
      expect(finalCruise.additionalSupplies!.find(s => s.id === 'zapalniczka')).toBeUndefined();

      // Final supplies should include the essentials
      const finalSupplies = finalCruise.additionalSupplies!;
      expect(finalSupplies.find(s => s.id === 'woda_butelkowana')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'papier_toaletowy')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'mydło')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'płyn_do_naczyń')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'worki_na_śmieci_120L')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'worki_na_śmieci_30L')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'herbata')).toBeDefined();
      expect(finalSupplies.find(s => s.id === 'kawa')).toBeDefined();
    });
  });
});
