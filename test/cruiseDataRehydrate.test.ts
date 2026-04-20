import { Cruise, CrewMember, CruiseDayRecipe, MealType, Recipie } from '../src/types';

const makeRecipe = (id: string): Recipie => ({
  id,
  name: id,
  description: 'desc',
  mealType: [MealType.DINNER],
  difficulty: 2,
  instructions: ['step'],
  ingredients: [{ id: 'jajka', amount: 3 }],
});

const makeMember = (id: string): CrewMember => ({ id, name: `Member ${id}`, tags: ['omnivore'] });

const makeRecipeEntry = (id: string, crewCount: number, mealSlot: MealType): CruiseDayRecipe => ({
  originalRecipeId: id,
  recipeData: makeRecipe(id),
  crewCount,
  mealSlot,
});

const originalCruise: Cruise = {
  id: 'test-id',
  name: 'Test Cruise',
  dateCreated: '2024-01-01T00:00:00.000Z',
  dateModified: '2024-01-02T00:00:00.000Z',
  length: 2,
  crewMembers: [makeMember('m1'), makeMember('m2'), makeMember('m3')],
  days: [
    {
      dayNumber: 1,
      recipes: [
        makeRecipeEntry('jajecznica', 3, MealType.BREAKFAST),
        makeRecipeEntry('spaghetti', 3, MealType.DINNER),
      ],
    },
    {
      dayNumber: 2,
      recipes: [makeRecipeEntry('pesto', 2, MealType.DINNER)],
    },
  ],
  additionalSupplies: [{ id: 'woda', amount: 10, isPerPerson: false, isPerDay: true }],
  startDate: '2024-06-01',
};

describe('Cruise JSON round-trip (rehydration)', () => {
  let roundTripped: Cruise;

  beforeAll(() => {
    roundTripped = JSON.parse(JSON.stringify(originalCruise));
  });

  it('should preserve crewMembers array length', () => {
    expect(roundTripped.crewMembers).toHaveLength(originalCruise.crewMembers.length);
  });

  it('should preserve crewMember id, name, and tags on each member', () => {
    roundTripped.crewMembers.forEach((m, i) => {
      expect(m.id).toBe(originalCruise.crewMembers[i].id);
      expect(m.name).toBe(originalCruise.crewMembers[i].name);
      expect(m.tags).toEqual(originalCruise.crewMembers[i].tags);
    });
  });

  it('crewMembers.length after round-trip equals original crew count (guards against scalar regression)', () => {
    expect(roundTripped.crewMembers.length).toBe(3);
    expect((roundTripped as unknown as Record<string, unknown>)['crew']).toBeUndefined();
  });

  it('should preserve days[].recipes[].crewCount', () => {
    expect(roundTripped.days[0].recipes[0].crewCount).toBe(3);
    expect(roundTripped.days[0].recipes[1].crewCount).toBe(3);
    expect(roundTripped.days[1].recipes[0].crewCount).toBe(2);
  });

  it('should preserve days[].recipes[].mealSlot', () => {
    expect(roundTripped.days[0].recipes[0].mealSlot).toBe(MealType.BREAKFAST);
    expect(roundTripped.days[0].recipes[1].mealSlot).toBe(MealType.DINNER);
  });

  it('should preserve days[].recipes[].recipeData as required field', () => {
    const r = roundTripped.days[0].recipes[0];
    expect(r.recipeData).toBeDefined();
    expect(r.recipeData.id).toBe('jajecznica');
    expect(r.recipeData.ingredients).toEqual([{ id: 'jajka', amount: 3 }]);
  });

  it('should preserve originalRecipeId', () => {
    expect(roundTripped.days[0].recipes[0].originalRecipeId).toBe('jajecznica');
    expect(roundTripped.days[1].recipes[0].originalRecipeId).toBe('pesto');
  });

  it('should preserve top-level cruise fields', () => {
    expect(roundTripped.id).toBe(originalCruise.id);
    expect(roundTripped.name).toBe(originalCruise.name);
    expect(roundTripped.length).toBe(originalCruise.length);
    expect(roundTripped.startDate).toBe(originalCruise.startDate);
  });

  it('should preserve additionalSupplies', () => {
    expect(roundTripped.additionalSupplies).toEqual(originalCruise.additionalSupplies);
  });
});
