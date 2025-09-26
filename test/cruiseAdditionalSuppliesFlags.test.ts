import {
  createNewCruise,
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise
} from '../src/model/cruiseData';
import { Cruise } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock } from './cruiseTestHarness';

describe('cruiseAdditionalSuppliesFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCruises();
  });

  describe('multiple entries for same supply with different flags', () => {
    it('should allow multiple entries for same supply with different flag combinations', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      setupCruises([cruise]);

      // Add water bottles with different flag combinations
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 10, false, false); // Fixed amount
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 2, true, false);  // Per person
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 1, false, true);  // Per day
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 3, true, true);   // Per person per day

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(4);

      // Check each entry
      const fixed = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && !s.isPerPerson && !s.isPerDay);
      expect(fixed).toEqual({ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false });

      const perPerson = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && s.isPerPerson && !s.isPerDay);
      expect(perPerson).toEqual({ id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false });

      const perDay = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && !s.isPerPerson && s.isPerDay);
      expect(perDay).toEqual({ id: 'woda_butelkowana', amount: 1, isPerPerson: false, isPerDay: true });

      const perPersonPerDay = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && s.isPerPerson && s.isPerDay);
      expect(perPersonPerDay).toEqual({ id: 'woda_butelkowana', amount: 3, isPerPerson: true, isPerDay: true });
    });

    it('should update only the correct entry when adding with same flags', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      cruise.additionalSupplies = [
        { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
        { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false }
      ];
      setupCruises([cruise]);

      // Update the per-person entry
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 5, true, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(2);

      // Fixed amount should remain unchanged
      const fixed = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && !s.isPerPerson && !s.isPerDay);
      expect(fixed?.amount).toBe(10);

      // Per person should be updated
      const perPerson = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && s.isPerPerson && !s.isPerDay);
      expect(perPerson?.amount).toBe(7);
    });
  });

  describe('updateAdditionalSupplyAmount with flags', () => {
    it('should update only the specific entry identified by id and flags', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      cruise.additionalSupplies = [
        { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
        { id: 'papier_toaletowy', amount: 2, isPerPerson: true, isPerDay: false },
        { id: 'papier_toaletowy', amount: 1, isPerPerson: false, isPerDay: true }
      ];
      setupCruises([cruise]);

      // Update only the per-day entry
      updateAdditionalSupplyAmount('test-cruise', 'papier_toaletowy', 3, false, true);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(3);

      // Check that only the per-day entry was updated
      const fixed = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && !s.isPerPerson && !s.isPerDay);
      expect(fixed?.amount).toBe(5);

      const perPerson = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && s.isPerPerson && !s.isPerDay);
      expect(perPerson?.amount).toBe(2);

      const perDay = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && !s.isPerPerson && s.isPerDay);
      expect(perDay?.amount).toBe(3);
    });

    it('should add new entry if no entry matches the id and flags combination', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      cruise.additionalSupplies = [
        { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false }
      ];
      setupCruises([cruise]);

      // Try to update non-existent per-person entry (should add it)
      updateAdditionalSupplyAmount('test-cruise', 'papier_toaletowy', 10, true, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      // Array should have 2 entries now
      expect(updatedCruise.additionalSupplies).toHaveLength(2);

      // Original entry should remain
      const fixed = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && !s.isPerPerson && !s.isPerDay);
      expect(fixed).toEqual({
        id: 'papier_toaletowy',
        amount: 5,
        isPerPerson: false,
        isPerDay: false
      });

      // New entry should be added
      const perPerson = updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && s.isPerPerson && !s.isPerDay);
      expect(perPerson).toEqual({
        id: 'papier_toaletowy',
        amount: 10,
        isPerPerson: true,
        isPerDay: false
      });
    });
  });

  describe('removeAdditionalSupplyFromCruise with flags', () => {
    it('should remove only the specific entry identified by id and flags', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      cruise.additionalSupplies = [
        { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false },
        { id: 'mydło', amount: 1, isPerPerson: true, isPerDay: false },
        { id: 'mydło', amount: 2, isPerPerson: false, isPerDay: true },
        { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false }
      ];
      setupCruises([cruise]);

      // Remove only the per-day soap entry
      removeAdditionalSupplyFromCruise('test-cruise', 'mydło', false, true);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(3);

      // Check remaining soap entries
      const fixedSoap = updatedCruise.additionalSupplies!.find(s => s.id === 'mydło' && !s.isPerPerson && !s.isPerDay);
      expect(fixedSoap).toBeDefined();

      const perPersonSoap = updatedCruise.additionalSupplies!.find(s => s.id === 'mydło' && s.isPerPerson && !s.isPerDay);
      expect(perPersonSoap).toBeDefined();

      // Per-day soap should be gone
      const perDaySoap = updatedCruise.additionalSupplies!.find(s => s.id === 'mydło' && !s.isPerPerson && s.isPerDay);
      expect(perDaySoap).toBeUndefined();

      // Water should remain
      const water = updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana');
      expect(water).toBeDefined();
    });

    it('should do nothing if no entry matches the id and flags combination', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      cruise.additionalSupplies = [
        { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false }
      ];
      setupCruises([cruise]);

      // Try to remove non-existent per-person entry
      removeAdditionalSupplyFromCruise('test-cruise', 'mydło', true, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      // Array should remain unchanged
      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'mydło',
        amount: 4,
        isPerPerson: false,
        isPerDay: false
      });
    });
  });

  describe('edge cases', () => {
    it('should handle adding the same supply with same flags multiple times (should update)', () => {
      const cruise = createNewCruise('Test Cruise', 7, 4);
      cruise.id = 'test-cruise';
      setupCruises([cruise]);

      // Add same supply with same flags twice
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 10, false, false);
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 15, false, false);

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(1);
      expect(updatedCruise.additionalSupplies![0]).toEqual({
        id: 'woda_butelkowana',
        amount: 25,
        isPerPerson: false,
        isPerDay: false
      });
    });

    it('should correctly manage complex scenarios with multiple supplies and flag combinations', () => {
      const cruise = createNewCruise('Complex Test Cruise', 10, 5);
      cruise.id = 'complex-test-cruise';
      setupCruises([cruise]);

      // Add various supplies with different flag combinations
      addAdditionalSupplyToCruise('complex-test-cruise', 'woda_butelkowana', 20, false, false); // Fixed
      addAdditionalSupplyToCruise('complex-test-cruise', 'woda_butelkowana', 2, true, false);   // Per person
      addAdditionalSupplyToCruise('complex-test-cruise', 'papier_toaletowy', 5, false, true);  // Per day
      addAdditionalSupplyToCruise('complex-test-cruise', 'mydło', 3, false, false);           // Fixed
      addAdditionalSupplyToCruise('complex-test-cruise', 'mydło', 1, true, true);             // Per person per day

      // Update specific entries
      updateAdditionalSupplyAmount('complex-test-cruise', 'woda_butelkowana', 25, false, false); // Update fixed water
      updateAdditionalSupplyAmount('complex-test-cruise', 'papier_toaletowy', 7, false, true);   // Update per-day toilet paper

      // Remove specific entries
      removeAdditionalSupplyFromCruise('complex-test-cruise', 'woda_butelkowana', true, false); // Remove per-person water
      removeAdditionalSupplyFromCruise('complex-test-cruise', 'mydło', true, true);             // Remove per-person-per-day soap

      const storedCruises = getStoredCruises();
      const updatedCruise = storedCruises[0];

      expect(updatedCruise.additionalSupplies).toHaveLength(3);

      // Verify remaining entries
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && !s.isPerPerson && !s.isPerDay)?.amount).toBe(25);
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'papier_toaletowy' && !s.isPerPerson && s.isPerDay)?.amount).toBe(7);
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'mydło' && !s.isPerPerson && !s.isPerDay)?.amount).toBe(3);

      // Verify removed entries are gone
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'woda_butelkowana' && s.isPerPerson && !s.isPerDay)).toBeUndefined();
      expect(updatedCruise.additionalSupplies!.find(s => s.id === 'mydło' && s.isPerPerson && s.isPerDay)).toBeUndefined();
    });
  });
});
