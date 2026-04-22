import { getMealCoverage, getDayCoverage, getCruiseCoverage, countCrewWithTag, getActiveDietTags, getDefaultCrewCount } from '../src/model/cruiseDietCoverage';
import { createRecipie } from '../src/model/recipieData';
import { CrewMember, CruiseDayRecipe, MealType, Recipie, Cruise } from '../src/types';
import theories from 'jest-theories';

// Mock supplies so isRecipieVegan/isRecipieVegetarian work deterministically
jest.mock('../src/data/supplies.json', () => [
  { id: 'tofu', name: 'Tofu', unit: 'g', isIngredient: true, category: 'inne', isVegetarian: true, isVegan: true },
  { id: 'pasta', name: 'Pasta', unit: 'g', isIngredient: true, category: 'zboża', isVegetarian: true, isVegan: true },
  { id: 'cheese', name: 'Ser', unit: 'g', isIngredient: true, category: 'nabiał', isVegetarian: true, isVegan: false },
  { id: 'meat', name: 'Mięso', unit: 'g', isIngredient: true, category: 'mięso', isVegetarian: false, isVegan: false },
  { id: 'egg', name: 'Jajko', unit: 'szt', isIngredient: true, category: 'nabiał', isVegetarian: true, isVegan: false },
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const member = (id: string, ...tags: string[]): CrewMember => ({ id, tags });
const omni = (id: string) => member(id, 'omnivore');
const veg = (id: string) => member(id, 'vegetarian');
const vegan = (id: string) => member(id, 'vegan');
const halal = (id: string) => member(id, 'halal');

const recipe = (id: string, ingredientIds: string[], mealSlot: MealType = MealType.DINNER): Recipie =>
  createRecipie({
    id,
    name: id,
    description: '',
    mealType: [mealSlot],
    difficulty: 1,
    instructions: [],
    ingredients: ingredientIds.map(iid => ({ id: iid, amount: 1 })),
  });

const slot = (r: Recipie, crewCount: number, mealSlot: MealType = MealType.DINNER): CruiseDayRecipe => ({
  originalRecipeId: r.id,
  recipeData: r,
  crewCount,
  mealSlot,
});

const makeCruise = (members: CrewMember[], dayRecipes: CruiseDayRecipe[] = []): Cruise => ({
  id: 'c1',
  name: 'Test',
  dateCreated: '',
  dateModified: '',
  length: 1,
  crewMembers: members,
  days: [{ dayNumber: 1, recipes: dayRecipes }],
});

// ---------------------------------------------------------------------------
// Recipes used in multiple tests
// ---------------------------------------------------------------------------

const spaghetti = recipe('spaghetti-omni', ['meat', 'pasta']); // omnivore
const tofu = recipe('tofu-vegan', ['tofu']);                    // vegan
const pasta = recipe('pasta-veg', ['pasta', 'cheese']);         // vegetarian (non-vegan)
const stirFry = recipe('stir-fry-vegan', ['tofu', 'pasta']);   // vegan
const eggs = recipe('eggs-omni', ['egg', 'meat']);              // omnivore

// ---------------------------------------------------------------------------
// getMealCoverage — table-driven scenarios
// ---------------------------------------------------------------------------

describe('getMealCoverage', () => {
  describe('basic coverage scenarios', () => {
    it('should cover 5 omni with spaghetti ×5', () => {
      const crew = [omni('1'), omni('2'), omni('3'), omni('4'), omni('5')];
      const result = getMealCoverage([slot(spaghetti, 5)], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
      expect(result.surplus).toBe(0);
    });

    it('should cover 5 omni + 1 vegan with spaghetti ×5 + tofu ×1', () => {
      const crew = [omni('1'), omni('2'), omni('3'), omni('4'), omni('5'), vegan('6')];
      const result = getMealCoverage(
        [slot(spaghetti, 5), slot(tofu, 1)],
        crew,
        MealType.DINNER
      );
      expect(result.unfed).toHaveLength(0);
      expect(result.surplus).toBe(0);
    });

    it('should report missing vegan ×1 when only spaghetti ×6 given to 5 omni + 1 vegan', () => {
      const crew = [omni('1'), omni('2'), omni('3'), omni('4'), omni('5'), vegan('6')];
      const result = getMealCoverage([slot(spaghetti, 6)], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(1);
      expect(result.unfed[0].id).toBe('6');
      expect(result.missingTagCounts.vegan).toBe(1);
    });

    it('should cover 5 omni + 1 vegan with tofu ×6 (vegan recipe feeds omnis)', () => {
      const crew = [omni('1'), omni('2'), omni('3'), omni('4'), omni('5'), vegan('6')];
      const result = getMealCoverage([slot(tofu, 6)], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
      expect(result.surplus).toBe(0);
    });

    it('should cover 5 omni + 2 veg + 1 vegan with stir-fry ×1, pasta ×2, spaghetti ×5 (max-flow assignment)', () => {
      const crew = [
        omni('1'), omni('2'), omni('3'), omni('4'), omni('5'),
        veg('6'), veg('7'),
        vegan('8'),
      ];
      const result = getMealCoverage(
        [slot(stirFry, 1), slot(pasta, 2), slot(spaghetti, 5)],
        crew,
        MealType.DINNER
      );
      expect(result.unfed).toHaveLength(0);
    });

    it('should report 1 unfed vegetarian: stir-fry ×1, pasta ×1, spaghetti ×6 for 5 omni + 2 veg + 1 vegan', () => {
      const crew = [
        omni('1'), omni('2'), omni('3'), omni('4'), omni('5'),
        veg('6'), veg('7'),
        vegan('8'),
      ];
      const result = getMealCoverage(
        [slot(stirFry, 1), slot(pasta, 1), slot(spaghetti, 6)],
        crew,
        MealType.DINNER
      );
      // stir-fry (vegan, 1 portion) will be taken by vegan; pasta only 1 portion for 2 vegetarians
      expect(result.unfed).toHaveLength(1);
    });
  });

  describe('surplus detection', () => {
    it('should report surplus 2 for 3 omni with soup ×5', () => {
      const crew = [omni('1'), omni('2'), omni('3')];
      const result = getMealCoverage([slot(spaghetti, 5)], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
      expect(result.surplus).toBe(2);
    });
  });

  describe('Dinic correctness: crewCount > 1 split', () => {
    it('should cover 3 vegans with tofu-A ×2 + tofu-B ×1', () => {
      const tofuA = recipe('tofu-A', ['tofu']);
      const tofuB = recipe('tofu-B', ['tofu']);
      const crew = [vegan('1'), vegan('2'), vegan('3')];
      const result = getMealCoverage(
        [slot(tofuA, 2), slot(tofuB, 1)],
        crew,
        MealType.DINNER
      );
      expect(result.unfed).toHaveLength(0);
    });
  });

  describe('unknown tags treated as non-restrictive', () => {
    it('should not false-flag halal crew member as unfed when steak ×2 given', () => {
      const crew = [omni('1'), halal('2')];
      const result = getMealCoverage([slot(spaghetti, 2)], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
    });
  });

  describe('empty crew', () => {
    it('should return empty report for 0 crew members', () => {
      const result = getMealCoverage([slot(spaghetti, 5)], [], MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
      expect(result.totalNeeded).toBe(0);
    });
  });

  describe('original + modified recipe on same meal slot', () => {
    it('should cover 3 omni + 2 vegan with original-bolognese ×3 and bolognese-tofu ×2', () => {
      const bolognese = recipe('bolognese', ['meat']);       // omnivore
      const bologneseTofu = recipe('bolognese', ['tofu']);   // vegan (same originalRecipeId)
      const crew = [omni('1'), omni('2'), omni('3'), vegan('4'), vegan('5')];
      const result = getMealCoverage(
        [
          { originalRecipeId: 'bolognese', recipeData: bolognese, crewCount: 3, mealSlot: MealType.DINNER },
          { originalRecipeId: 'bolognese', recipeData: bologneseTofu, crewCount: 2, mealSlot: MealType.DINNER },
        ],
        crew,
        MealType.DINNER
      );
      expect(result.unfed).toHaveLength(0);
      expect(result.surplus).toBe(0);
    });
  });

  describe('reclassified recipe via ingredient flags', () => {
    it('should cover 1 vegan with modified-bolognese (meat→tofu) ×2', () => {
      const veganBolognese = recipe('bolognese-vegan', ['tofu']);
      const crew = [vegan('1')];
      const result = getMealCoverage([slot(veganBolognese, 2)], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
      expect(result.surplus).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// getDayCoverage — mealSlot filtering
// ---------------------------------------------------------------------------

describe('getDayCoverage', () => {
  it('should only include non-snack mealSlots in coverage', () => {
    const cookie = recipe('cookie', ['tofu']);
    const snackEntry: CruiseDayRecipe = {
      originalRecipeId: 'cookie',
      recipeData: cookie,
      crewCount: 5,
      mealSlot: MealType.SNACK,
    };
    const crew = [omni('1')];
    const report = getDayCoverage(1, [snackEntry], crew);
    expect(report.meals).toHaveLength(0);
  });

  it('should count recipe toward only its assigned mealSlot', () => {
    const eggsBreakfast: CruiseDayRecipe = {
      originalRecipeId: 'eggs',
      recipeData: eggs,
      crewCount: 2,
      mealSlot: MealType.BREAKFAST,
    };
    const crew = [omni('1'), omni('2')];
    const report = getDayCoverage(1, [eggsBreakfast], crew);
    const breakfastMeal = report.meals.find(m => m.mealType === MealType.BREAKFAST);
    const dinnerMeal = report.meals.find(m => m.mealType === MealType.DINNER);
    expect(breakfastMeal?.unfed).toHaveLength(0);
    expect(dinnerMeal).toBeUndefined();
  });

  it('should set isFullyCovered false when any meal has unfed members', () => {
    const crew = [omni('1'), vegan('2')];
    const report = getDayCoverage(1, [slot(spaghetti, 2)], crew);
    expect(report.isFullyCovered).toBe(false);
  });

  it('should set hasSurplus true when any meal has surplus', () => {
    const crew = [omni('1')];
    const report = getDayCoverage(1, [slot(spaghetti, 3)], crew);
    expect(report.hasSurplus).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCruiseCoverage
// ---------------------------------------------------------------------------

describe('getCruiseCoverage', () => {
  it('should return empty array for cruise with 0 crew members', () => {
    const cruise = makeCruise([]);
    expect(getCruiseCoverage(cruise)).toEqual([]);
  });

  it('should return one report per day', () => {
    const crew = [omni('1'), omni('2')];
    const cruise: Cruise = {
      id: 'c', name: 'c', dateCreated: '', dateModified: '',
      length: 3,
      crewMembers: crew,
      days: [
        { dayNumber: 1, recipes: [slot(spaghetti, 2)] },
        { dayNumber: 2, recipes: [] },
        { dayNumber: 3, recipes: [slot(tofu, 2)] },
      ],
    };
    const reports = getCruiseCoverage(cruise);
    expect(reports).toHaveLength(3);
    expect(reports[0].dayNumber).toBe(1);
    expect(reports[2].dayNumber).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// countCrewWithTag / getActiveDietTags
// ---------------------------------------------------------------------------

describe('countCrewWithTag', () => {
  it('should count members with specified tag', () => {
    const cruise = makeCruise([omni('1'), omni('2'), vegan('3'), veg('4')]);
    expect(countCrewWithTag(cruise, 'omnivore')).toBe(2);
    expect(countCrewWithTag(cruise, 'vegan')).toBe(1);
    expect(countCrewWithTag(cruise, 'vegetarian')).toBe(1);
    expect(countCrewWithTag(cruise, 'gluten-free')).toBe(0);
  });
});

describe('getActiveDietTags', () => {
  it('should return only tags present in crew', () => {
    const cruise = makeCruise([omni('1'), vegan('2')]);
    const tags = getActiveDietTags(cruise);
    expect(tags).toContain('omnivore');
    expect(tags).toContain('vegan');
    expect(tags).not.toContain('vegetarian');
  });
});

// ---------------------------------------------------------------------------
// getDefaultCrewCount
// ---------------------------------------------------------------------------

describe('getDefaultCrewCount', () => {
  const mixedCrew = [
    omni('1'), omni('2'), omni('3'),
    veg('4'), veg('5'),
    vegan('6'),
  ];

  it('vegan recipe + mixed crew → full crew size', () => {
    const cruise = makeCruise(mixedCrew);
    expect(getDefaultCrewCount(cruise, tofu)).toBe(6);
  });

  it('vegetarian (non-vegan) recipe + mixed crew → total minus vegan count', () => {
    const cruise = makeCruise(mixedCrew);
    expect(getDefaultCrewCount(cruise, pasta)).toBe(5);
  });

  it('omnivore recipe + mixed crew → omnivore count', () => {
    const cruise = makeCruise(mixedCrew);
    expect(getDefaultCrewCount(cruise, spaghetti)).toBe(3);
  });

  it('vegan recipe + all-omni crew → full crew size', () => {
    const cruise = makeCruise([omni('1'), omni('2')]);
    expect(getDefaultCrewCount(cruise, tofu)).toBe(2);
  });

  it('omnivore recipe + crew with no omnivores → 0', () => {
    const cruise = makeCruise([veg('1'), vegan('2')]);
    expect(getDefaultCrewCount(cruise, spaghetti)).toBe(0);
  });

  it('vegetarian recipe + crew with all vegans → crewSize - veganCount = 0', () => {
    const cruise = makeCruise([vegan('1'), vegan('2')]);
    expect(getDefaultCrewCount(cruise, pasta)).toBe(0);
  });

  it('should return 0 cleanly for empty crew', () => {
    const cruise = makeCruise([]);
    expect(getDefaultCrewCount(cruise, spaghetti)).toBe(0);
    expect(getDefaultCrewCount(cruise, pasta)).toBe(0);
    expect(getDefaultCrewCount(cruise, tofu)).toBe(0);
  });
});
