import {
  createNewCruise,
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise,
  groupAdditionalSuppliesByCategory
} from '../src/model/cruiseData';
import { CruiseSupply } from '../src/types';
import { setupCruises, clearCruises, getStoredCruises, localStorageMock, makeCrewMembers } from './cruiseTestHarness';

describe('cruiseSupplies', () => {
  const supply = (id: string, amount: number, perPerson: boolean, perDay: boolean) =>
    expect.objectContaining({ id, amount, isPerPerson: perPerson, isPerDay: perDay });

  const findSupply = (supplies: CruiseSupply[], id: string, perPerson = false, perDay = false) =>
    supplies.find(s => s.id === id && s.isPerPerson === perPerson && s.isPerDay === perDay);

  const setupTestCruise = (opts?: { id?: string; supplies?: CruiseSupply[]; length?: number; crew?: number }) => {
    const id = opts?.id ?? 'rejs-na-mazury-2024';
    const cruise = createNewCruise('Rejs na Mazury 2024', opts?.length ?? 7, makeCrewMembers(opts?.crew ?? 4));
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

  describe('addAdditionalSupplyToCruise', () => {
    it('should add a new non-ingredient supply to a cruise', () => {
      setupTestCruise();

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'papier_toaletowy', 7, false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('papier_toaletowy', 7, false, false));
    });

    it('should add to amount if supply already exists', () => {
      setupTestCruise({
        supplies: [{ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false }],
      });

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 15, false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('woda_butelkowana', 25, false, false));
    });

    it('should merge amounts when calling addAdditionalSupplyToCruise multiple times', () => {
      setupTestCruise();

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 5, false, false);
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 10, false, false);
      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'woda_butelkowana', 8, false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('woda_butelkowana', 23, false, false));
    });

    it('should initialize additionalSupplies array if it does not exist', () => {
      setupTestCruise();

      addAdditionalSupplyToCruise('rejs-na-mazury-2024', 'mydło', 4, false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('mydło', 4, false, false));
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      addAdditionalSupplyToCruise('nonexistent-cruise', 'papier_toaletowy', 7, false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('updateAdditionalSupplyAmount', () => {
    it('should update the amount of an existing supply', () => {
      setupTestCruise({
        supplies: [
          { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false },
        ],
      });

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10, false, false);

      expect(getSupplies()).toHaveLength(2);
      expect(findSupply(getSupplies(), 'papier_toaletowy')?.amount).toBe(10);
      expect(findSupply(getSupplies(), 'woda_butelkowana')?.amount).toBe(20);
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      updateAdditionalSupplyAmount('nonexistent-cruise', 'papier_toaletowy', 10, false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should add new entry if cruise has no additional supplies', () => {
      setupTestCruise();

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10, false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0]).toEqual(supply('papier_toaletowy', 10, false, false));
    });

    it('should add new entry if supply does not exist', () => {
      setupTestCruise({
        supplies: [{ id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false }],
      });

      updateAdditionalSupplyAmount('rejs-na-mazury-2024', 'papier_toaletowy', 10, false, false);

      expect(getSupplies()).toHaveLength(2);
      expect(getSupplies()).toEqual(expect.arrayContaining([
        supply('papier_toaletowy', 10, false, false),
        supply('woda_butelkowana', 20, false, false),
      ]));
    });
  });

  describe('removeAdditionalSupplyFromCruise', () => {
    it('should remove a supply from the cruise', () => {
      setupTestCruise({
        supplies: [
          { id: 'papier_toaletowy', amount: 7, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 28, isPerPerson: false, isPerDay: false },
          { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false },
        ],
      });

      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło', false, false);

      expect(getSupplies()).toHaveLength(2);
      expect(findSupply(getSupplies(), 'mydło')).toBeUndefined();
      expect(findSupply(getSupplies(), 'papier_toaletowy')).toBeDefined();
      expect(findSupply(getSupplies(), 'woda_butelkowana')).toBeDefined();
    });

    it('should do nothing if cruise does not exist', () => {
      setupCruises([]);

      removeAdditionalSupplyFromCruise('nonexistent-cruise', 'mydło', false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should do nothing if cruise has no additional supplies', () => {
      setupTestCruise();

      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło', false, false);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle case when supply does not exist', () => {
      setupTestCruise({
        supplies: [{ id: 'woda_butelkowana', amount: 28, isPerPerson: false, isPerDay: false }],
      });

      removeAdditionalSupplyFromCruise('rejs-na-mazury-2024', 'mydło', false, false);

      expect(getSupplies()).toHaveLength(1);
      expect(getSupplies()[0].id).toBe('woda_butelkowana');
    });
  });

  describe('groupAdditionalSuppliesByCategory', () => {
    it('should group additional supplies by category', () => {
      setupTestCruise({
        id: 'test-cruise',
        supplies: [
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
          { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
          { id: 'mydło', amount: 3, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false },
        ],
        crew: 3,
        length: 5,
      });

      const grouped = groupAdditionalSuppliesByCategory('test-cruise');

      expect(grouped).toHaveLength(2);
      expect(grouped.find(g => g.category === 'napoje')!.supplies).toHaveLength(2);
      expect(grouped.find(g => g.category === 'środki czystości')!.supplies).toHaveLength(2);
    });

    it('should return empty array for cruise with no additional supplies', () => {
      setupTestCruise({ id: 'empty-cruise', length: 3, crew: 2 });

      expect(groupAdditionalSuppliesByCategory('empty-cruise')).toEqual([]);
    });

    it('should sort categories alphabetically', () => {
      setupTestCruise({
        id: 'sort-test-cruise',
        length: 1,
        crew: 1,
        supplies: [
          { id: 'mydło', amount: 1, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 1, isPerPerson: false, isPerDay: false },
          { id: 'herbata', amount: 1, isPerPerson: false, isPerDay: false },
        ],
      });

      const grouped = groupAdditionalSuppliesByCategory('sort-test-cruise');

      expect(grouped).toHaveLength(2);
      expect(grouped[0].category).toBe('napoje');
      expect(grouped[1].category).toBe('środki czystości');
    });

    it('should handle supplies with different flag combinations separately and sort by flag priority', () => {
      setupTestCruise({
        id: 'flag-test-cruise',
        supplies: [
          { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: true },
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 3, isPerPerson: false, isPerDay: true },
          { id: 'woda_butelkowana', amount: 5, isPerPerson: true, isPerDay: false },
        ],
      });

      const grouped = groupAdditionalSuppliesByCategory('flag-test-cruise');
      const supplies = grouped.find(g => g.category === 'napoje')!.supplies;

      expect(supplies).toHaveLength(4);
      expect(supplies[0]).toEqual(expect.objectContaining({ amount: 10, isPerPerson: false, isPerDay: false }));
      expect(supplies[1]).toEqual(expect.objectContaining({ amount: 5, isPerPerson: true, isPerDay: false }));
      expect(supplies[2]).toEqual(expect.objectContaining({ amount: 3, isPerPerson: false, isPerDay: true }));
      expect(supplies[3]).toEqual(expect.objectContaining({ amount: 2, isPerPerson: true, isPerDay: true }));
    });

    it('should return empty array for non-existent cruise', () => {
      setupCruises([]);

      expect(groupAdditionalSuppliesByCategory('non-existent-cruise')).toEqual([]);
    });
  });

  describe('realistic cruise supplies management', () => {
    it('should demonstrate typical cruise supply operations', () => {
      const cruise = createNewCruise('Żeglarski Rejs Bałtycki 2024', 10, makeCrewMembers(6));
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
        { id: 'kawa', amount: 200, isPerPerson: false, isPerDay: false },
      ];
      let storage: { [key: string]: string } = {};
      storage['cyber-ochmistrz-cruises'] = JSON.stringify([cruise]);
      localStorageMock.getItem.mockImplementation((key: string) => storage[key] || null);
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        storage[key] = value;
      });

      const id = 'zeglarski-rejs-baltycki-2024';

      updateAdditionalSupplyAmount(id, 'woda_butelkowana', 80, false, false);
      updateAdditionalSupplyAmount(id, 'papier_toaletowy', 20, false, false);

      expect(findSupply(getSupplies(), 'woda_butelkowana')?.amount).toBe(80);
      expect(findSupply(getSupplies(), 'papier_toaletowy')?.amount).toBe(20);

      removeAdditionalSupplyFromCruise(id, 'ręcznik_papierowy', false, false);
      removeAdditionalSupplyFromCruise(id, 'zapalniczka', false, false);

      const finalSupplies = getSupplies();
      expect(finalSupplies).toHaveLength(8);
      expect(findSupply(finalSupplies, 'ręcznik_papierowy')).toBeUndefined();
      expect(findSupply(finalSupplies, 'zapalniczka')).toBeUndefined();

      for (const expectedId of ['woda_butelkowana', 'papier_toaletowy', 'mydło', 'płyn_do_naczyń', 'worki_na_śmieci_120L', 'worki_na_śmieci_30L', 'herbata', 'kawa']) {
        expect(findSupply(finalSupplies, expectedId)).toBeDefined();
      }
    });
  });
});
