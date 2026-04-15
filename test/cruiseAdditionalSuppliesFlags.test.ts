import {
  createNewCruise,
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise
} from '../src/model/cruiseData';
import { CruiseSupply } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises } from './cruiseTestHarness';

describe('cruiseAdditionalSuppliesFlags', () => {
  const supply = (id: string, amount: number, perPerson: boolean, perDay: boolean) =>
    expect.objectContaining({ id, amount, isPerPerson: perPerson, isPerDay: perDay });

  const findSupply = (supplies: CruiseSupply[], id: string, perPerson: boolean, perDay: boolean) =>
    supplies.find(s => s.id === id && s.isPerPerson === perPerson && s.isPerDay === perDay);

  const setupTestCruise = (opts?: { id?: string; supplies?: CruiseSupply[]; length?: number; crew?: number }) => {
    const id = opts?.id ?? 'test-cruise';
    const cruise = createNewCruise('Test Cruise', opts?.length ?? 7, opts?.crew ?? 4);
    cruise.id = id;
    if (opts?.supplies) cruise.additionalSupplies = opts.supplies;
    setupCruises([cruise]);
    return id;
  };

  const getSupplies = () => getStoredCruises()[0].additionalSupplies!;

  beforeEach(() => {
    jest.clearAllMocks();
    clearCruises();
  });

  describe('multiple entries for same supply with different flags', () => {
    it('should allow multiple entries for same supply with different flag combinations', () => {
      setupTestCruise();

      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 10, false, false);
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 2, true, false);
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 1, false, true);
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 3, true, true);

      expect(getSupplies()).toHaveLength(4);
      expect(getSupplies()).toEqual(expect.arrayContaining([
        supply('woda_butelkowana', 10, false, false),
        supply('woda_butelkowana', 2,  true,  false),
        supply('woda_butelkowana', 1,  false, true),
        supply('woda_butelkowana', 3,  true,  true),
      ]));
    });

    it('should update only the correct entry when adding with same flags', () => {
      setupTestCruise({
        supplies: [
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false },
        ],
      });

      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 5, true, false);

      expect(getSupplies()).toHaveLength(2);
      expect(findSupply(getSupplies(), 'woda_butelkowana', false, false)?.amount).toBe(10);
      expect(findSupply(getSupplies(), 'woda_butelkowana', true, false)?.amount).toBe(7);
    });
  });

  describe('updateAdditionalSupplyAmount with flags', () => {
    it('should update only the specific entry identified by id and flags', () => {
      setupTestCruise({
        supplies: [
          { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
          { id: 'papier_toaletowy', amount: 2, isPerPerson: true, isPerDay: false },
          { id: 'papier_toaletowy', amount: 1, isPerPerson: false, isPerDay: true },
        ],
      });

      updateAdditionalSupplyAmount('test-cruise', 'papier_toaletowy', 3, false, true);

      expect(getSupplies()).toHaveLength(3);
      expect(findSupply(getSupplies(), 'papier_toaletowy', false, false)?.amount).toBe(5);
      expect(findSupply(getSupplies(), 'papier_toaletowy', true, false)?.amount).toBe(2);
      expect(findSupply(getSupplies(), 'papier_toaletowy', false, true)?.amount).toBe(3);
    });

    it('should add new entry if no entry matches the id and flags combination', () => {
      setupTestCruise({
        supplies: [{ id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false }],
      });

      updateAdditionalSupplyAmount('test-cruise', 'papier_toaletowy', 10, true, false);

      expect(getSupplies()).toHaveLength(2);
      expect(getSupplies()).toEqual(expect.arrayContaining([
        supply('papier_toaletowy', 5,  false, false),
        supply('papier_toaletowy', 10, true,  false),
      ]));
    });
  });

  describe('removeAdditionalSupplyFromCruise with flags', () => {
    it('should remove only the specific entry identified by id and flags', () => {
      setupTestCruise({
        supplies: [
          { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false },
          { id: 'mydło', amount: 1, isPerPerson: true, isPerDay: false },
          { id: 'mydło', amount: 2, isPerPerson: false, isPerDay: true },
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
        ],
      });

      removeAdditionalSupplyFromCruise('test-cruise', 'mydło', false, true);

      expect(getSupplies()).toHaveLength(3);
      expect(findSupply(getSupplies(), 'mydło', false, false)).toBeDefined();
      expect(findSupply(getSupplies(), 'mydło', true, false)).toBeDefined();
      expect(findSupply(getSupplies(), 'mydło', false, true)).toBeUndefined();
      expect(findSupply(getSupplies(), 'woda_butelkowana', false, false)).toBeDefined();
    });

    it('should do nothing if no entry matches the id and flags combination', () => {
      setupTestCruise({
        supplies: [{ id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false }],
      });

      removeAdditionalSupplyFromCruise('test-cruise', 'mydło', true, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('mydło', 4, false, false));
    });
  });

  describe('edge cases', () => {
    it('should handle adding the same supply with same flags multiple times (should update)', () => {
      setupTestCruise();

      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 10, false, false);
      addAdditionalSupplyToCruise('test-cruise', 'woda_butelkowana', 15, false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('woda_butelkowana', 25, false, false));
    });

    it('should correctly manage complex scenarios with multiple supplies and flag combinations', () => {
      const id = setupTestCruise({ id: 'complex-test-cruise', length: 10, crew: 5 });

      addAdditionalSupplyToCruise(id, 'woda_butelkowana', 20, false, false);
      addAdditionalSupplyToCruise(id, 'woda_butelkowana', 2, true, false);
      addAdditionalSupplyToCruise(id, 'papier_toaletowy', 5, false, true);
      addAdditionalSupplyToCruise(id, 'mydło', 3, false, false);
      addAdditionalSupplyToCruise(id, 'mydło', 1, true, true);

      updateAdditionalSupplyAmount(id, 'woda_butelkowana', 25, false, false);
      updateAdditionalSupplyAmount(id, 'papier_toaletowy', 7, false, true);

      removeAdditionalSupplyFromCruise(id, 'woda_butelkowana', true, false);
      removeAdditionalSupplyFromCruise(id, 'mydło', true, true);

      expect(getSupplies()).toHaveLength(3);
      expect(findSupply(getSupplies(), 'woda_butelkowana', false, false)?.amount).toBe(25);
      expect(findSupply(getSupplies(), 'papier_toaletowy', false, true)?.amount).toBe(7);
      expect(findSupply(getSupplies(), 'mydło', false, false)?.amount).toBe(3);
      expect(findSupply(getSupplies(), 'woda_butelkowana', true, false)).toBeUndefined();
      expect(findSupply(getSupplies(), 'mydło', true, true)).toBeUndefined();
    });
  });
});
