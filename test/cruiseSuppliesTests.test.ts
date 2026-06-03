import { Cruise, CruiseSupply } from '../src/model/cruise';
import { makeCrewMembers } from './cruiseTestHarness';

jest.mock('../src/data/supplies.json', () => [
  { id: 'woda_butelkowana', name: 'Woda butelkowana', unit: 'litry', category: 'napoje', isIngredient: false },
  { id: 'herbata', name: 'Herbata czarna', unit: 'torebka', category: 'napoje', isIngredient: false },
  { id: 'kawa', name: 'Kawa', unit: 'gramy', category: 'napoje', isIngredient: false },
  { id: 'mydło', name: 'Mydło', unit: 'sztuki', category: 'środki czystości', isIngredient: false },
  { id: 'papier_toaletowy', name: 'Papier toaletowy', unit: 'rolki', category: 'środki czystości', isIngredient: false },
  { id: 'płyn_do_naczyń', name: 'Płyn do naczyń', unit: 'sztuki', category: 'środki czystości', isIngredient: false },
  { id: 'ręcznik_papierowy', name: 'Ręcznik papierowy', unit: 'rolki', category: 'środki czystości', isIngredient: false },
  { id: 'worki_na_śmieci_120L', name: 'Worki na śmieci 120L', unit: 'sztuki', category: 'środki czystości', isIngredient: false },
  { id: 'worki_na_śmieci_30L', name: 'Worki na śmieci 30L', unit: 'sztuki', category: 'środki czystości', isIngredient: false },
  { id: 'zapalniczka', name: 'Zapalniczka', unit: 'sztuki', category: 'inne', isIngredient: false },
]);

describe('cruiseSupplies', () => {
  const supply = (id: string, amount: number, perPerson: boolean, perDay: boolean) =>
    expect.objectContaining({ id, amount, isPerPerson: perPerson, isPerDay: perDay });

  const findSupply = (supplies: readonly CruiseSupply[], id: string, perPerson = false, perDay = false) =>
    supplies.find(s => s.id === id && s.isPerPerson === perPerson && s.isPerDay === perDay);

  const setupTestCruise = (opts?: { supplies?: CruiseSupply[]; length?: number; crew?: number }): Cruise =>
    Cruise.createNew('Rejs na Mazury 2024', opts?.length ?? 7, makeCrewMembers(opts?.crew ?? 4), undefined, opts?.supplies);

  // upsertAdditionalSupply overwrites the amount for a matching (id, isPerPerson, isPerDay) entry
  describe('upsertAdditionalSupply (insert)', () => {
    it('should add a new non-ingredient supply to a cruise', () => {
      let cruise = setupTestCruise();

      cruise = cruise.upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 7, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(1);
      expect(cruise.additionalSupplies[0]).toEqual(supply('papier_toaletowy', 7, false, false));
    });

    it('should overwrite the amount if supply already exists (last write wins)', () => {
      let cruise = setupTestCruise({
        supplies: [{ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false }],
      });

      cruise = cruise.upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 15, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(1);
      // overwrite, not additive: 10 replaced by 15
      expect(cruise.additionalSupplies[0]).toEqual(supply('woda_butelkowana', 15, false, false));
    });

    it('should keep only the last value when upserting the same supply multiple times', () => {
      let cruise = setupTestCruise();

      cruise = cruise
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 5, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 8, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(1);
      // last write wins: final upsert of 8
      expect(cruise.additionalSupplies[0]).toEqual(supply('woda_butelkowana', 8, false, false));
    });

    it('should add a supply to a cruise that starts with no additional supplies', () => {
      let cruise = setupTestCruise();

      cruise = cruise.upsertAdditionalSupply({ id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(1);
      expect(cruise.additionalSupplies[0]).toEqual(supply('mydło', 4, false, false));
    });
  });

  describe('upsertAdditionalSupply (update)', () => {
    it('should update the amount of an existing supply', () => {
      let cruise = setupTestCruise({
        supplies: [
          { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false },
        ],
      });

      cruise = cruise.upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 10, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(2);
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy')?.amount).toBe(10);
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana')?.amount).toBe(20);
    });

    it('should add a new entry if the cruise has no additional supplies', () => {
      let cruise = setupTestCruise();

      cruise = cruise.upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 10, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(1);
      expect(cruise.additionalSupplies[0]).toEqual(supply('papier_toaletowy', 10, false, false));
    });

    it('should add a new entry if the supply does not exist yet', () => {
      let cruise = setupTestCruise({
        supplies: [{ id: 'woda_butelkowana', amount: 20, isPerPerson: false, isPerDay: false }],
      });

      cruise = cruise.upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 10, isPerPerson: false, isPerDay: false });

      expect(cruise.additionalSupplies).toHaveLength(2);
      expect(cruise.additionalSupplies).toEqual(expect.arrayContaining([
        supply('papier_toaletowy', 10, false, false),
        supply('woda_butelkowana', 20, false, false),
      ]));
    });
  });

  describe('removeAdditionalSupply', () => {
    it('should remove a supply from the cruise', () => {
      let cruise = setupTestCruise({
        supplies: [
          { id: 'papier_toaletowy', amount: 7, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 28, isPerPerson: false, isPerDay: false },
          { id: 'mydło', amount: 4, isPerPerson: false, isPerDay: false },
        ],
      });

      cruise = cruise.removeAdditionalSupply('mydło', false, false);

      expect(cruise.additionalSupplies).toHaveLength(2);
      expect(findSupply(cruise.additionalSupplies, 'mydło')).toBeUndefined();
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy')).toBeDefined();
      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana')).toBeDefined();
    });

    it('should do nothing if the cruise has no additional supplies', () => {
      let cruise = setupTestCruise();

      cruise = cruise.removeAdditionalSupply('mydło', false, false);

      expect(cruise.additionalSupplies).toHaveLength(0);
    });

    it('should leave supplies untouched when the target supply does not exist', () => {
      let cruise = setupTestCruise({
        supplies: [{ id: 'woda_butelkowana', amount: 28, isPerPerson: false, isPerDay: false }],
      });

      cruise = cruise.removeAdditionalSupply('mydło', false, false);

      expect(cruise.additionalSupplies).toHaveLength(1);
      expect(cruise.additionalSupplies[0].id).toBe('woda_butelkowana');
    });
  });

  describe('groupAdditionalSuppliesByCategory', () => {
    it('should group additional supplies by category', () => {
      const cruise = setupTestCruise({
        supplies: [
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
          { id: 'papier_toaletowy', amount: 5, isPerPerson: false, isPerDay: false },
          { id: 'mydło', amount: 3, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: false },
        ],
        crew: 3,
        length: 5,
      });

      const grouped = cruise.groupAdditionalSuppliesByCategory();

      expect(grouped).toHaveLength(2);
      expect(grouped.find(g => g.category === 'napoje')!.supplies).toHaveLength(2);
      expect(grouped.find(g => g.category === 'środki czystości')!.supplies).toHaveLength(2);
    });

    it('should return empty array for cruise with no additional supplies', () => {
      const cruise = setupTestCruise({ length: 3, crew: 2 });

      expect(cruise.groupAdditionalSuppliesByCategory()).toEqual([]);
    });

    it('should sort categories alphabetically', () => {
      const cruise = setupTestCruise({
        length: 1,
        crew: 1,
        supplies: [
          { id: 'mydło', amount: 1, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 1, isPerPerson: false, isPerDay: false },
          { id: 'herbata', amount: 1, isPerPerson: false, isPerDay: false },
        ],
      });

      const grouped = cruise.groupAdditionalSuppliesByCategory();

      expect(grouped).toHaveLength(2);
      expect(grouped[0].category).toBe('napoje');
      expect(grouped[1].category).toBe('środki czystości');
    });

    it('should handle supplies with different flag combinations separately and sort by flag priority', () => {
      const cruise = setupTestCruise({
        supplies: [
          { id: 'woda_butelkowana', amount: 2, isPerPerson: true, isPerDay: true },
          { id: 'woda_butelkowana', amount: 10, isPerPerson: false, isPerDay: false },
          { id: 'woda_butelkowana', amount: 3, isPerPerson: false, isPerDay: true },
          { id: 'woda_butelkowana', amount: 5, isPerPerson: true, isPerDay: false },
        ],
      });

      const grouped = cruise.groupAdditionalSuppliesByCategory();
      const supplies = grouped.find(g => g.category === 'napoje')!.supplies;

      expect(supplies).toHaveLength(4);
      expect(supplies[0]).toEqual(expect.objectContaining({ amount: 10, isPerPerson: false, isPerDay: false }));
      expect(supplies[1]).toEqual(expect.objectContaining({ amount: 5, isPerPerson: true, isPerDay: false }));
      expect(supplies[2]).toEqual(expect.objectContaining({ amount: 3, isPerPerson: false, isPerDay: true }));
      expect(supplies[3]).toEqual(expect.objectContaining({ amount: 2, isPerPerson: true, isPerDay: true }));
    });
  });

  describe('realistic cruise supplies management', () => {
    it('should demonstrate typical cruise supply operations', () => {
      let cruise = setupTestCruise({
        crew: 6,
        length: 10,
        supplies: [
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
        ],
      });

      cruise = cruise
        .upsertAdditionalSupply({ id: 'woda_butelkowana', amount: 80, isPerPerson: false, isPerDay: false })
        .upsertAdditionalSupply({ id: 'papier_toaletowy', amount: 20, isPerPerson: false, isPerDay: false });

      expect(findSupply(cruise.additionalSupplies, 'woda_butelkowana')?.amount).toBe(80);
      expect(findSupply(cruise.additionalSupplies, 'papier_toaletowy')?.amount).toBe(20);

      cruise = cruise
        .removeAdditionalSupply('ręcznik_papierowy', false, false)
        .removeAdditionalSupply('zapalniczka', false, false);

      const finalSupplies = cruise.additionalSupplies;
      expect(finalSupplies).toHaveLength(8);
      expect(findSupply(finalSupplies, 'ręcznik_papierowy')).toBeUndefined();
      expect(findSupply(finalSupplies, 'zapalniczka')).toBeUndefined();

      for (const expectedId of ['woda_butelkowana', 'papier_toaletowy', 'mydło', 'płyn_do_naczyń', 'worki_na_śmieci_120L', 'worki_na_śmieci_30L', 'herbata', 'kawa']) {
        expect(findSupply(finalSupplies, expectedId)).toBeDefined();
      }
    });
  });
});
