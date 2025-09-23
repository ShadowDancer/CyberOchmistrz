import {
  createNewCruise,
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise
} from '../src/model/cruiseData';
import { Cruise } from '../src/types';
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

      // Add toilet paper for the cruise
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'papier_toaletowy', 7); // 7 rolls for 7 days

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'papier_toaletowy',
        amount: 7
      });
    });

    it('should update amount if supply already exists', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [{ id: 'woda_butelkowana', amount: 10 }];
      setupCruises([cruise]);

      // Add more water bottles
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 15);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'woda_butelkowana',
        amount: 15 // Updated amount
      });
    });

    it('should initialize additionalSupplies array if it does not exist', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      // No additionalSupplies initially
      setupCruises([cruise]);

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'mydło', 4);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'mydło',
        amount: 4
      });
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      addAdditionalSupplyToCruise('nonexistent-cruise', 'papier_toaletowy', 7);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('updateAdditionalSupplyAmount', () => {
    it('should update the amount of an existing supply', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [
        { id: 'papier_toaletowy', amount: 5 },
        { id: 'woda_butelkowana', amount: 20 }
      ];
      setupCruises([cruise]);

      // Update toilet paper amount
      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(2);
      const toiletPaper = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy');
      expect(toiletPaper?.amount).toBe(10);
      // Other supplies should remain unchanged
      const water = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana');
      expect(water?.amount).toBe(20);
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      updateAdditionalSupplyAmount('nonexistent-cruise', 'papier_toaletowy', 10);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if cruise has no additional supplies', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      // No additionalSupplies
      setupCruises([cruise]);

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if supply does not exist', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [{ id: 'woda_butelkowana', amount: 20 }];
      setupCruises([cruise]);

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeAdditionalSupplyFromCruise', () => {
    it('should remove a supply from the cruise', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [
        { id: 'papier_toaletowy', amount: 7 },
        { id: 'woda_butelkowana', amount: 28 },
        { id: 'mydło', amount: 4 }
      ];
      setupCruises([cruise]);

      // Remove soap
      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło');

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

      removeAdditionalSupplyFromCruise('nonexistent-cruise', 'mydło');

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if cruise has no additional supplies', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      // No additionalSupplies
      setupCruises([cruise]);

      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło');

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle case when supply does not exist', () => {
      const cruise = createNewCruise('Rejs na Mazury 2024', 7, 4);
      cruise.id = 'rejs-na-mazury-2024';
      cruise.additionalSupplies = [{ id: 'woda_butelkowana', amount: 28 }];
      setupCruises([cruise]);

      const initialCallCount = localStorageMock.setItem.mock.calls.length;
      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło');

      // setItem is called (saveCruise is always called), but the array should remain unchanged
      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0].id).toBe('woda_butelkowana');
    });
  });

  describe('realistic cruise supplies management', () => {
    it('should demonstrate typical cruise supply operations', () => {
      // Use storage-based approach for this test
      const cruise = createNewCruise('Żeglarski Rejs Bałtycki 2024', 10, 6);
      cruise.id = 'zeglarski-rejs-baltycki-2024';
      cruise.additionalSupplies = [
        { id: 'woda_butelkowana', amount: 60 },
        { id: 'papier_toaletowy', amount: 15 },
        { id: 'mydło', amount: 6 },
        { id: 'płyn_do_naczyń', amount: 2 },
        { id: 'worki_na_śmieci_120L', amount: 20 },
        { id: 'worki_na_śmieci_30L', amount: 30 },
        { id: 'ręcznik_papierowy', amount: 5 },
        { id: 'zapalniczka', amount: 3 },
        { id: 'herbata', amount: 20 },
        { id: 'kawa', amount: 200 }
      ];
      // Set initial storage directly
      let storage: { [key: string]: string } = {};
      storage['cyber-ochmistrz-cruises'] = JSON.stringify([cruise]);
      localStorageMock.getItem.mockImplementation((key: string) => storage[key] || null);
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        storage[key] = value;
      });

      // Update some amounts based on actual needs
      updateAdditionalSupplyAmount('zeglarski-rejs-baltycki-2024', 'woda_butelkowana', 80); // Need more water
      updateAdditionalSupplyAmount('zeglarski-rejs-baltycki-2024', 'papier_toaletowy', 20); // Need more toilet paper

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana')?.amount).toBe(80);
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy')?.amount).toBe(20);

      // Remove items that are no longer needed
      removeAdditionalSupplyFromCruise('zeglarski-rejs-baltycki-2024', 'ręcznik_papierowy'); // Not needed
      removeAdditionalSupplyFromCruise('zeglarski-rejs-baltycki-2024', 'zapalniczka'); // Not needed

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
