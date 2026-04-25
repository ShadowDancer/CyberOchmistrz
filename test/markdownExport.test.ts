import { generateMarkdown } from '../src/utils/markdownExport';
import { Cruise, CruiseDay, CruiseDayRecipe, CrewMember, MealType, Recipie } from '../src/types';
import { makeCrewMembers } from './cruiseTestHarness';

jest.mock('../src/data/supplies.json', () => [
  { id: 'egg', name: 'Jajko', unit: 'sztuki', isIngredient: true, category: 'nabiał', isVegetarian: true, isVegan: false },
  { id: 'meat', name: 'Wołowina', unit: 'gramy', isIngredient: true, category: 'mięso', isVegetarian: false, isVegan: false },
  { id: 'bread', name: 'Chleb', unit: 'sztuki', isIngredient: true, category: 'pieczywo', isVegetarian: true, isVegan: true },
]);

const makeRecipe = (id: string, name: string, ingredientIds: string[], instructions: string[]): Recipie => ({
  id,
  name,
  ingredients: ingredientIds.map(iid => ({ id: iid, amount: 1 })),
  description: '',
  mealType: [MealType.DINNER],
  difficulty: 1,
  instructions,
});

const makeDayRecipe = (recipe: Recipie, crewCount: number, mealSlot: MealType = MealType.DINNER): CruiseDayRecipe => ({
  originalRecipeId: recipe.id,
  recipeData: recipe,
  crewCount,
  mealSlot,
});

const makeCruise = (crewMembers: CrewMember[], days: CruiseDay[], startDate?: string): Cruise => ({
  id: 'test',
  name: 'Test',
  dateCreated: '',
  dateModified: '',
  length: days.length,
  crewMembers,
  days,
  startDate,
});

const EMPTY_DAY_1 = [
  '# Dzień 1',
  '## Śniadanie\nBrak przepisów',
  '## Obiad\nBrak przepisów',
  '## Kolacja\nBrak przepisów',
  '## Przekąska\nBrak przepisów',
].join('\n\n') + '\n\n---';

describe('generateMarkdown', () => {
  // 1
  it('one day, no crew, no recipes — all 4 slots show Brak przepisów', () => {
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toBe(EMPTY_DAY_1);
  });

  // 2
  it('one day, no crew, one recipe — surplus warning appears', () => {
    const recipe = makeRecipe('r1', 'Jajecznica', ['egg'], ['Krok 1', 'Krok 2']);
    // crewCount=3, no crew → surplus=3 → 3 załoganci
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 3)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    const expected = [
      '# Dzień 1',
      '## Śniadanie\nBrak przepisów',
      [
        '## Obiad',
        'UWAGA! Nadwyżka racji! Nadmiarowa ilość porcji: 3',
        '### Jajecznica.\n\nSkładniki:\n- 3 sztuki Jajko\n\nSposób przygotowania:\n1. Krok 1\n2. Krok 2',
      ].join('\n\n'),
      '## Kolacja\nBrak przepisów',
      '## Przekąska\nBrak przepisów',
    ].join('\n\n') + '\n\n---';
    expect(result).toBe(expected);
  });

  // 3
  it('one day, one omnivore crew member, matching recipe — no warnings', () => {
    const recipe = makeRecipe('r1', 'Obiadek', ['bread'], ['Krok 1']);
    const crew = makeCrewMembers(1); // omnivore by default
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 1)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).not.toContain('UWAGA!');
    expect(result).toContain('Obiadek.');
    expect(result).toContain('Składniki:');
    expect(result).toContain('- 1 sztuka Chleb');
  });

  // 4
  it('two days, one recipe each — both days present with correct headers', () => {
    const recipe1 = makeRecipe('r1', 'Zupa', ['bread'], ['Krok 1']);
    const recipe2 = makeRecipe('r2', 'Sałatka', ['egg'], ['Krok 2']);
    const days: CruiseDay[] = [
      { dayNumber: 1, recipes: [makeDayRecipe(recipe1, 0)] },
      { dayNumber: 2, recipes: [makeDayRecipe(recipe2, 0)] },
    ];
    const cruise = makeCruise([], days);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('# Dzień 1');
    expect(result).toContain('# Dzień 2');
    expect(result).toContain('Zupa.');
    expect(result).toContain('Sałatka.');
    // Day 1 appears before Day 2
    expect(result.indexOf('# Dzień 1')).toBeLessThan(result.indexOf('# Dzień 2'));
  });

  // 5
  it('one day, unfed vegetarian crew member — unfed warning with name and tag', () => {
    const recipe = makeRecipe('r1', 'Kotlet', ['meat'], ['Krok 1']);
    const crew: CrewMember[] = [{ id: 'c1', name: 'Kasia', tags: ['vegetarian'] }];
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 1)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('UWAGA! Braki w kambuzie! Nienakarmieni załoganci:');
    expect(result).toContain('- Kasia');
    expect(result).toContain('Brakuje wegetariańska: 1');
  });

  // 6
  it('cruise with startDate — day header shows Polish date', () => {
    // 2026-04-25 is a Saturday → Sobota
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [] }], '2026-04-25');
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('# Sobota, 25 kwietnia 2026');
  });

  // 7
  it('cruise without startDate — day header shows Dzień N', () => {
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('# Dzień 1');
  });

  // 8
  it('meal slot with no recipes — outputs Brak przepisów for that slot', () => {
    const recipe = makeRecipe('r1', 'Jajecznica', ['egg'], ['Krok 1']);
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 1, MealType.DINNER)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('## Kolacja\nBrak przepisów');
  });

  // 9
  it('multiple recipes in same slot — all listed sequentially, warnings appear once', () => {
    const r1 = makeRecipe('r1', 'Zupa', ['bread'], ['Krok 1']);
    const r2 = makeRecipe('r2', 'Sałatka', ['egg'], ['Krok 2']);
    // crewCount=2 each → totalPortions=4, no crew → surplus=4 → 4 załogantów
    const cruise = makeCruise([], [{
      dayNumber: 1,
      recipes: [makeDayRecipe(r1, 2, MealType.DINNER), makeDayRecipe(r2, 2, MealType.DINNER)],
    }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    // Warnings appear once
    expect(result.match(/UWAGA! Nadwyżka racji!/g)?.length).toBe(1);
    expect(result).toContain('UWAGA! Nadwyżka racji! Nadmiarowa ilość porcji: 4');
    // Both recipes present
    expect(result).toContain('Zupa.');
    expect(result).toContain('Sałatka.');
    // Zupa before Sałatka
    expect(result.indexOf('Zupa.')).toBeLessThan(result.indexOf('Sałatka.'));
  });

  // 10
  it('surplus warning — correct count shown', () => {
    const recipe = makeRecipe('r1', 'Kotlet', ['bread'], ['Krok 1']);
    const crew = makeCrewMembers(2); // 2 omnivore
    // crewCount=5 → surplus = 5-2 = 3 → 3 załoganci
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 5)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('UWAGA! Nadwyżka racji! Nadmiarowa ilość porcji: 3');
  });

  // 11
  it('member with multiple diet tags — all tags listed comma-separated in warning', () => {
    // Egg recipe: vegetarian (isVegetarian=true) but not vegan (isVegan=false)
    const recipe = makeRecipe('r1', 'Jajecznica', ['egg'], ['Krok 1']);
    // Member has both vegetarian and vegan tags — vegan tag fails because egg is not vegan
    const crew: CrewMember[] = [{ id: 'c1', name: 'Ela', tags: ['vegetarian', 'vegan'] }];
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 1)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('UWAGA! Braki w kambuzie! Nienakarmieni załoganci:');
    expect(result).toContain('- Ela');
    expect(result).toContain('Brakuje wegetariańska: 1, wegańska: 1');
  });

  // 12
  it('ingredient amounts — multiplied by crewCount, unit declined correctly', () => {
    const recipe: Recipie = {
      id: 'r1',
      name: 'Kotlet',
      // 5 eggs + 100g meat per person, crewCount=2 → 10 eggs, 200g meat
      ingredients: [{ id: 'egg', amount: 5 }, { id: 'meat', amount: 100 }],
      description: '',
      mealType: [MealType.DINNER],
      difficulty: 1,
      instructions: ['Krok 1'],
    };
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 2)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    // 5 * 2 = 10 → declineUnit('sztuki', 10) = 'sztuk'
    expect(result).toContain('- 10 sztuk Jajko');
    // 100 * 2 = 200 → declineUnit('gramy', 200) = 'gramów'
    expect(result).toContain('- 200 gramów Wołowina');
  });
});
