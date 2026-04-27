import { generateMarkdown } from '../src/utils/markdownExport';
import { Cruise, CruiseDay, CruiseDayRecipe, MealType, Recipie } from '../src/types';
import { Diet, CrewMember } from '../src/model/crew';
import { makeCrewMembers } from './cruiseTestHarness';

jest.mock('../src/data/recipies.json', () => [
  { id: 'catalog-base', name: 'Zupa bazowa', ingredients: [{ id: 'bread', amount: 1 }], description: '', mealType: ['obiad'], difficulty: 1, instructions: ['Krok katalogowy 1', 'Krok katalogowy 2'] },
]);

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
  it('one day, no crew, one recipe', () => {
    const recipe = makeRecipe('r1', 'Jajecznica', ['egg'], ['Krok 1', 'Krok 2']);
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 3)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('Jajecznica.');
    expect(result).toContain('- 3 sztuki Jajko');
  });

  // 3
  it('one day, one omnivore crew member, matching recipe', () => {
    const recipe = makeRecipe('r1', 'Obiadek', ['bread'], ['Krok 1']);
    const crew = makeCrewMembers(1); // omnivore by default
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 1)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
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
  it('one day, unfed vegetarian crew member', () => {
    const recipe = makeRecipe('r1', 'Kotlet', ['meat'], ['Krok 1']);
    const crew: CrewMember[] = [{ id: 'c1', name: 'Kasia', diet: 'vegetarian' as Diet }];
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 1)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('Kotlet.');
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
  it('multiple recipes in same slot — all listed sequentially', () => {
    const r1 = makeRecipe('r1', 'Zupa', ['bread'], ['Krok 1']);
    const r2 = makeRecipe('r2', 'Sałatka', ['egg'], ['Krok 2']);
    const cruise = makeCruise([], [{
      dayNumber: 1,
      recipes: [makeDayRecipe(r1, 2, MealType.DINNER), makeDayRecipe(r2, 2, MealType.DINNER)],
    }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    // Both recipes present
    expect(result).toContain('Zupa.');
    expect(result).toContain('Sałatka.');
    // Zupa before Sałatka
    expect(result.indexOf('Zupa.')).toBeLessThan(result.indexOf('Sałatka.'));
  });

  // 10
  it('recipe present in output regardless of surplus', () => {
    const recipe = makeRecipe('r1', 'Kotlet', ['bread'], ['Krok 1']);
    const crew = makeCrewMembers(2); // 2 omnivore
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 5)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).not.toContain('UWAGA!');
    expect(result).toContain('Kotlet.');
  });

  // 11
  it('unfed members of multiple diet types', () => {
    const recipe = makeRecipe('r1', 'Kotlet', ['meat'], ['Krok 1']);
    const crew: CrewMember[] = [
      { id: 'c1', name: 'Ela', diet: 'vegetarian' as Diet },
      { id: 'c2', name: 'Ola', diet: 'vegan' as Diet },
    ];
    const cruise = makeCruise(crew, [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 2)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('Kotlet.');
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

  // 13
  it('two versions same slot same originalRecipeId — grouped, instructions from catalog, note shown', () => {
    // v1: bigger crew (5), v2: smaller crew (3) — both share 'catalog-base'
    const v1: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      recipeData: makeRecipe('v1', 'Zupa z mięsem', ['meat'], ['Krok v1 — powinien być zignorowany']),
      crewCount: 5,
      mealSlot: MealType.DINNER,
    };
    const v2: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      recipeData: makeRecipe('v2', 'Zupa zwykła', ['bread'], ['Krok v2 — powinien być zignorowany']),
      crewCount: 3,
      mealSlot: MealType.DINNER,
    };
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [v1, v2] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    // Header: sorted desc → v1 first → names: ['Zupa z mięsem', 'Zupa zwykła']
    expect(result).toContain('### Zupa z mięsem / Zupa zwykła.');
    // Ingredient headers with correct declension: 5 → osób, 3 → osoby
    expect(result).toContain('Składniki (Zupa z mięsem, 5 osób):');
    // 1 * 5 = 5 gramów Wołowina
    expect(result).toContain('- 5 gramów Wołowina');
    expect(result).toContain('Składniki (Zupa zwykła, 3 osoby):');
    // 1 * 3 = 3 sztuki Chleb
    expect(result).toContain('- 3 sztuki Chleb');
    expect(result).toContain('Zmodyfikowana wersja przepisu wymaga od kuka okrętowego inwencji twórczej podczas gotowania!');
    // Instructions appear exactly once, from catalog
    expect(result.match(/Sposób przygotowania:/g)?.length).toBe(1);
    expect(result).toContain('1. Krok katalogowy 1');
    expect(result).toContain('2. Krok katalogowy 2');
    expect(result).not.toContain('Krok v1');
    expect(result).not.toContain('Krok v2');
  });

  // 14
  it('same originalRecipeId in different slots — two separate groups, no cross-slot merging', () => {
    const v1: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      recipeData: makeRecipe('d1', 'Obiad wersja A', ['meat'], ['krok']),
      crewCount: 5,
      mealSlot: MealType.DINNER,
    };
    const v2: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      recipeData: makeRecipe('d2', 'Obiad wersja B', ['bread'], ['krok']),
      crewCount: 3,
      mealSlot: MealType.DINNER,
    };
    const v3: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      recipeData: makeRecipe('s1', 'Kolacja wersja A', ['meat'], ['krok']),
      crewCount: 4,
      mealSlot: MealType.SUPPER,
    };
    const v4: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      recipeData: makeRecipe('s2', 'Kolacja wersja B', ['bread'], ['krok']),
      crewCount: 2,
      mealSlot: MealType.SUPPER,
    };
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [v1, v2, v3, v4] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    // Note appears once per slot group — 2 total
    expect(result.match(/Zmodyfikowana wersja przepisu/g)?.length).toBe(2);
    // DINNER group has 5-person and 3-person headers
    expect(result).toContain('Składniki (Obiad wersja A, 5 osób):');
    expect(result).toContain('Składniki (Obiad wersja B, 3 osoby):');
    // SUPPER group has 4-person and 2-person headers
    expect(result).toContain('Składniki (Kolacja wersja A, 4 osoby):');
    expect(result).toContain('Składniki (Kolacja wersja B, 2 osoby):');
    // DINNER slot appears before SUPPER slot
    expect(result.indexOf('## Obiad')).toBeLessThan(result.indexOf('## Kolacja'));
  });

  // 15
  it('three versions — sorted descending by crewCount, header deduped for matching names', () => {
    const v1: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      // crewCount=3, same name as v2 — should appear once in header (deduped)
      recipeData: makeRecipe('t1', 'Zupa', ['bread'], ['krok']),
      crewCount: 3,
      mealSlot: MealType.DINNER,
    };
    const v2: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      // crewCount=7, highest — comes first
      recipeData: makeRecipe('t2', 'Zupa', ['egg'], ['krok']),
      crewCount: 7,
      mealSlot: MealType.DINNER,
    };
    const v3: CruiseDayRecipe = {
      originalRecipeId: 'catalog-base',
      // crewCount=5, unique name
      recipeData: makeRecipe('t3', 'Zupa specjalna', ['meat'], ['krok']),
      crewCount: 5,
      mealSlot: MealType.DINNER,
    };
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [v1, v2, v3] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    // Sorted desc: 7,5,3 — first unique names in that order: ['Zupa','Zupa specjalna']
    expect(result).toContain('### Zupa / Zupa specjalna.');
    // Order in output: crewCount=7 before 5 before 3
    const idx7 = result.indexOf('Składniki (Zupa, 7 osób):');
    const idx5 = result.indexOf('Składniki (Zupa specjalna, 5 osób):');
    const idx3 = result.indexOf('Składniki (Zupa, 3 osoby):');
    expect(idx7).toBeLessThan(idx5);
    expect(idx5).toBeLessThan(idx3);
  });

  // 16
  it('catalog miss — falls back to first version instructions (highest crewCount), note still shown', () => {
    const v1: CruiseDayRecipe = {
      originalRecipeId: 'no-such-recipe',
      // crewCount=5 — highest, will be sortedGroup[0] → its instructions used as fallback
      recipeData: makeRecipe('f1', 'Zupa A', ['meat'], ['Fallback 1', 'Fallback 2']),
      crewCount: 5,
      mealSlot: MealType.DINNER,
    };
    const v2: CruiseDayRecipe = {
      originalRecipeId: 'no-such-recipe',
      recipeData: makeRecipe('f2', 'Zupa B', ['bread'], ['Ignorowany krok']),
      crewCount: 3,
      mealSlot: MealType.DINNER,
    };
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [v1, v2] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('Zmodyfikowana wersja przepisu wymaga od kuka okrętowego inwencji twórczej podczas gotowania!');
    // Fallback instructions from v1 (crewCount=5, first in sorted desc)
    expect(result).toContain('1. Fallback 1');
    expect(result).toContain('2. Fallback 2');
    expect(result).not.toContain('Ignorowany krok');
  });

  // 17
  it('single version — original format unchanged, no grouping markers', () => {
    const recipe = makeRecipe('r1', 'Zupa', ['bread'], ['Krok 1', 'Krok 2']);
    const cruise = makeCruise([], [{ dayNumber: 1, recipes: [makeDayRecipe(recipe, 2)] }]);
    const result = generateMarkdown(cruise).replace(/\r\n/g, '\n');
    expect(result).toContain('### Zupa.');
    // Single-recipe format uses 'Składniki:' not 'Składniki (...):'
    expect(result).toContain('Składniki:');
    expect(result).not.toContain('Składniki (');
    expect(result).not.toContain('Zmodyfikowana wersja przepisu');
  });
});
