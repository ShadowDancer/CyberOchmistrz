import { Cruise, CruiseSupply } from '../src/model/cruise';
import { makeCrewMembers } from './cruiseTestHarness';

describe('cruiseAdditionalSuppliesFlags', () => {
  const supply = (id: string, amount: number, perPerson: boolean, perDay: boolean) =>
    expect.objectContaining({ id, amount, isPerPerson: perPerson, isPerDay: perDay });

  const findSupply = (supplies: readonly CruiseSupply[], id: string, perPerson: boolean, perDay: boolean) =>
    supplies.find(s => s.id === id && s.isPerPerson === perPerson && s.isPerDay === perDay);

  const setupTestCruise = (opts?: { id?: string; supplies?: CruiseSupply[]; length?: number; crew?: number }): Cruise => {
    const cruise = Cruise.createNew(
      opts?.id ?? 'test-cruise',
      opts?.length ?? 7,
      makeCrewMembers(opts?.crew ?? 4),
      undefined,
      opts?.supplies
    );

    return cruise;
  };

  describe('multiple entries for same supply with different flags', () => {
    it('should allow multiple entries for same supply with different flag combinations', () => {
      let cruise = setupTestCruise();

      cruise = cruise.upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 1, isPerPerson: false, isPerDay: true })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 3, isPerPerson: true, isPerDay: true });

      expect(cruise.additionalSupplies).toHaveLength(4);
      expect(cruise.additionalSupplies).toEqual(expect.arrayContaining([
        supply('woda_butelkowana', 10, false, false),
        supply('woda_butelkowana', 2,  true,  false),
        supply('woda_butelkowana', 1,  false, true),
        supply('woda_butelkowana', 3,  true,  true),
      ]));
    });

    it('should update only the correct entry when adding with same flags', () => {
      let cruise = setupTestCruise({
        supplies: [
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false },
        ],
      });

      cruise = cruise.upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 5, isPerPerson: true, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(2);
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana', false, false)?.amount).toBe(10);
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana', true, false)?.amount).toBe(7);
    });
  });

  describe('updateAdditionalSupplyAmount with flags', () => {
    it('should update only the specific entry identified by id and flags', () => {
      let cruise = setupTestCruise({
        supplies: [
          { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
          { id: 'papier_toaletowy', amount: 2, isPerPerson: true, isPerDay: false },
          { id: 'papier_toaletowy', amount: 1, isPerPerson: false, isPerDay: true },
        ],
      });

      cruise = cruise.upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 1, isPerPerson: false, isPerDay: true });

      expect(cruise.additionalSupplies).toHaveLength(3);
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy', false, false)?.amount).toBe(5);
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy', true, false)?.amount).toBe(2);
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy', false, true)?.amount).toBe(3);
    });

    it('should add new entry if no entry matches the id and flags combination', () => {
      let cruise = setupTestCruise({
        supplies: [{ id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false }],
      });

      cruise = cruise.upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 10, isPerPerson: true, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(2);
      expect(cruise.additionalSupplies).toEqual(expect.arrayContaining([
        supply('papier_toaletowy', 5,  false, false),
        supply('papier_toaletowy', 10, true,  false),
      ]));
    });
  });

  describe('removeAdditionalSupplyFromCruise with flags', () => {
    it('should remove only the specific entry identified by id and flags', () => {
      let cruise = setupTestCruise({
        supplies: [
          { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false },
          { id: 'mydło', amount: 1, isPerPerson: true, isPerDay: false },
          { id: 'mydło', amount: 2, isPerPerson: false, isPerDay: true },
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
        ],
      });

      cruise = cruise.removeAdditionalSupply('mydło', false, true);

      expect(cruise.additionalSupplies).toHaveLength(3);
      expect(findSupply(cruise.additionalSupplies, 'mydło', false, false)).toBeDefined();
      expect(findSupply(cruise.additionalSupplies, 'mydło', true, false)).toBeDefined();
      expect(findSupply(cruise.additionalSupplies, 'mydło', false, true)).toBeUndefined();
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana', false, false)).toBeDefined();
    });

    it('should do nothing if no entry matches the id and flags combination', () => {
      let cruise = setupTestCruise({
        supplies: [{ id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false }],
      });

      cruise = cruise.removeAdditionalSupply('mydło', true, false);

      expect(cruise.additionalSupplies).toHaveLength(1);
      expect(cruise.additionalSupplies[0]).toEqual(supply('mydło', 4, false, false));
    });
  });

  describe('edge cases', () => {
    it('should handle adding the same supply with same flags multiple times (should update)', () => {
      let cruise = setupTestCruise();

      cruise = cruise
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 15, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(1);
      expect(cruise.additionalSupplies[0]).toEqual(supply('woda_butelkowana', 25, false, false));
    });

    it('should correctly manage complex scenarios with multiple supplies and flag combinations', () => {
      let cruise = setupTestCruise({ id: 'complex-test-cruise', length: 10, crew: 5 });

      cruise = cruise
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false })
        .upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: true })
        .upsertAdditionalSupply({ id: 'mydło', amount: 3, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'mydło', amount: 1, isPerPerson: true, isPerDay: true })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 25, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 7, isPerPerson: false, isPerDay: true })
        .removeAdditionalSupply('woda_butelkowana', true, false)
        .removeAdditionalSupply('mydło', true, true);

      expect(cruise.additionalSupplies).toHaveLength(3);
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana', false, false)?.amount).toBe(25);
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy', false, true)?.amount).toBe(7);
      expect(findSupply(cruise.additionalSupplies, 'mydło', false, false)?.amount).toBe(3);
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana', true, false)).toBeUndefined();
      expect(findSupply(cruise.additionalSupplies, 'mydło', true, true)).toBeUndefined();
    });
  });
});
