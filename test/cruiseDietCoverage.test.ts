import { getMealCoverage, getDayCoverage, getCruiseCoverage, countCrewWithTag, getActiveDietTags, canEat } from '../src/model/cruiseDietCoverage';
import { createRecipie } from '../src/model/recipieData';
import { Diet, CrewMember } from '../src/model/crew';
import { CruiseDayRecipe, Cruise } from '../src/model/cruise';
import { MealType, Recipie } from '../src/model/recipe';

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

const member = (id: string, diet: Diet = 'omnivore'): CrewMember => ({ id, name: id, diet });
const omni = (id: string) => member(id, 'omnivore');
const veg = (id: string) => member(id, 'vegetarian');
const vegan = (id: string) => member(id, 'vegan');

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

const makeCruise = (members: CrewMember[], dayRecipes: CruiseDayRecipe[] = []) => Cruise.createNew(
  'Test',
  1,
  members,
  [{ dayNumber: 1, recipes: dayRecipes }]);

// ---------------------------------------------------------------------------
// Recipes used in multiple tests
// ---------------------------------------------------------------------------

const spaghetti = recipe('spaghetti-omni', ['meat', 'pasta']); // omnivore
const tofu = recipe('tofu-vegan', ['tofu']);                    // vegan
const pasta = recipe('pasta-veg', ['pasta', 'cheese']);         // vegetarian (non-vegan)
const stirFry = recipe('stir-fry-vegan', ['tofu', 'pasta']);   // vegan
const eggs = recipe('eggs-omni', ['egg', 'meat']);              // omnivore

// ---------------------------------------------------------------------------
// canEat — unit tests
// ---------------------------------------------------------------------------

describe('canEat', () => {
  it('omnivore eats any recipe', () => {
    expect(canEat(omni('1'), spaghetti)).toBe(true);
    expect(canEat(omni('1'), tofu)).toBe(true);
    expect(canEat(omni('1'), pasta)).toBe(true);
  });

  it('vegetarian blocked by meat recipe', () => {
    expect(canEat(veg('1'), spaghetti)).toBe(false); // has meat
    expect(canEat(veg('1'), pasta)).toBe(true);      // dairy OK for vegetarian
    expect(canEat(veg('1'), tofu)).toBe(true);
  });

  it('vegan blocked by dairy recipe', () => {
    expect(canEat(vegan('1'), pasta)).toBe(false);   // has cheese (dairy, not vegan)
    expect(canEat(vegan('1'), tofu)).toBe(true);
    expect(canEat(vegan('1'), spaghetti)).toBe(false); // has meat
  });

  it('omnivore blocked by excluded ingredient', () => {
    const m = { ...omni('1'), excludedSupplies: ['meat'] };
    expect(canEat(m, spaghetti)).toBe(false); // spaghetti has meat
    expect(canEat(m, pasta)).toBe(true);      // pasta has no meat
  });

  it('omnivore not blocked when excluded ingredient absent from recipe', () => {
    const m = { ...omni('1'), excludedSupplies: ['cheese'] };
    expect(canEat(m, spaghetti)).toBe(true);  // spaghetti has no cheese
    expect(canEat(m, tofu)).toBe(true);       // tofu has no cheese
  });
});

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
      expect(result.forbiddenIngredientCounts).toEqual({});
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

  describe('ingredient exclusions', () => {
    it('member with exclusion blocked by matching ingredient', () => {
      // omni normally eats spaghetti, but excludes meat → blocked
      const m = { ...omni('1'), excludedSupplies: ['meat'] };
      const result = getMealCoverage([slot(spaghetti, 1)], [m], MealType.DINNER);
      expect(result.unfed).toHaveLength(1);
      // meat appears in slot recipe and is excluded by the unfed member
      expect(result.forbiddenIngredientCounts['meat']).toBe(1); // 1 unfed member excludes meat
    });

    it('member not blocked when excluded ingredient absent from recipe', () => {
      const m = { ...omni('1'), excludedSupplies: ['cheese'] };
      const result = getMealCoverage([slot(spaghetti, 1)], [m], MealType.DINNER);
      expect(result.unfed).toHaveLength(0);
      expect(result.forbiddenIngredientCounts).toEqual({});
    });

    it('member blocked by both diet and exclusion counted in forbiddenIngredientCounts', () => {
      // vegan excludes pasta; spaghetti has meat (diet block) and pasta (exclusion)
      const m = { ...vegan('1'), excludedSupplies: ['pasta'] };
      const result = getMealCoverage([slot(spaghetti, 1)], [m], MealType.DINNER);
      expect(result.unfed).toHaveLength(1);
      // pasta is in the recipe and excluded by unfed member
      expect(result.forbiddenIngredientCounts['pasta']).toBe(1); // 1 unfed member excludes pasta
    });
  });

  describe('edge cases', () => {
    it('should report all members unfed when no recipes given', () => {
      const crew = [omni('1'), vegan('2')];
      const result = getMealCoverage([], crew, MealType.DINNER);
      expect(result.unfed).toHaveLength(2);
      expect(result.totalPortions).toBe(0);
      expect(result.surplus).toBe(0);
    });

    it('should leave member unfed when recipe has crewCount 0', () => {
      const result = getMealCoverage([slot(spaghetti, 0)], [omni('1')], MealType.DINNER);
      expect(result.unfed).toHaveLength(1);
    });

    it('should report surplus and unfed simultaneously when diet mismatch', () => {
      // 5 meat portions for 1 vegan → surplus 4 (max(0, 5-1)), vegan unfed
      const result = getMealCoverage([slot(spaghetti, 5)], [vegan('1')], MealType.DINNER);
      expect(result.surplus).toBe(4);
      expect(result.unfed).toHaveLength(1);
    });

    it('should report all unfed with correct tag counts when all recipes incompatible', () => {
      const result = getMealCoverage(
        [slot(spaghetti, 2), slot(eggs, 2)],
        [vegan('1'), vegan('2')],
        MealType.DINNER
      );
      expect(result.unfed).toHaveLength(2);
      expect(result.forbiddenIngredientCounts).toEqual({});
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

  it('should not be fully covered when crew present but no recipes', () => {
    const report = getDayCoverage(1, [], [omni('1')]);
    expect(report.isFullyCovered).toBe(false);
    expect(report.hasSurplus).toBe(false);
  });

  it('should be fully covered when both crew and recipes empty', () => {
    const report = getDayCoverage(1, [], []);
    expect(report.meals).toHaveLength(0);
    expect(report.isFullyCovered).toBe(true);
  });

  it('should compute each meal type independently', () => {
    const breakfastSlot = slot(eggs, 2, MealType.BREAKFAST);
    const dinnerSlot = slot(spaghetti, 2, MealType.DINNER);
    const crew = [omni('1'), omni('2')];
    const report = getDayCoverage(1, [breakfastSlot, dinnerSlot], crew);
    expect(report.meals).toHaveLength(2);
    expect(report.meals.find(m => m.mealType === MealType.BREAKFAST)?.unfed).toHaveLength(0);
    expect(report.meals.find(m => m.mealType === MealType.DINNER)?.unfed).toHaveLength(0);
  });

  it('should report fully covered with no surplus on exact match', () => {
    const crew = [omni('1'), omni('2')];
    const report = getDayCoverage(1, [
      slot(spaghetti, 2, MealType.BREAKFAST),
      slot(spaghetti, 2, MealType.DINNER),
      slot(spaghetti, 2, MealType.SUPPER),
    ], crew);
    expect(report.isFullyCovered).toBe(true);
    expect(report.hasSurplus).toBe(false);
  });

  it('should not be fully covered when a non-snack meal type is missing', () => {
    const crew = [omni('1'), omni('2')];
    // Only breakfast + dinner — supper missing → not fully covered
    const report = getDayCoverage(1, [
      slot(spaghetti, 2, MealType.BREAKFAST),
      slot(spaghetti, 2, MealType.DINNER),
    ], crew);
    expect(report.isFullyCovered).toBe(false);
  });

  it('should be fully covered with all non-snack meals present even without snack', () => {
    const crew = [omni('1'), omni('2')];
    const report = getDayCoverage(1, [
      slot(spaghetti, 2, MealType.BREAKFAST),
      slot(spaghetti, 2, MealType.DINNER),
      slot(spaghetti, 2, MealType.SUPPER),
    ], crew);
    expect(report.isFullyCovered).toBe(true);
  });

  it('should report ok / unfed / surplus across three different meals in one day', () => {
    const crew = [omni('1'), omni('2'), omni('3'), vegan('4')];
    const report = getDayCoverage(1, [
      slot(eggs, 3, MealType.BREAKFAST), slot(tofu, 1, MealType.BREAKFAST), // 3 omni + 1 vegan = exact
      slot(spaghetti, 4, MealType.DINNER),                                  // vegan can't eat meat → 1 unfed
      slot(tofu, 6, MealType.SUPPER),                                       // vegan feeds all, 6 - 4 = 2 surplus
    ], crew);

    expect(report.meals).toHaveLength(3);

    const breakfast = report.meals.find(m => m.mealType === MealType.BREAKFAST)!;
    expect(breakfast.unfed).toHaveLength(0);
    expect(breakfast.surplus).toBe(0);

    const dinner = report.meals.find(m => m.mealType === MealType.DINNER)!;
    expect(dinner.unfed).toHaveLength(1);
    expect(dinner.unfed[0].id).toBe('4');
    expect(dinner.surplus).toBe(0);

    const supper = report.meals.find(m => m.mealType === MealType.SUPPER)!;
    expect(supper.unfed).toHaveLength(0);
    expect(supper.surplus).toBe(2);

    expect(report.isFullyCovered).toBe(false);
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

  it('should return one report per day with correct coverage per day', () => {
    const crew = [omni('1'), omni('2'), vegan('3')];
    const cruise: Cruise = Cruise.createNew(
      'Test',
      3,
      crew,
      [
        {
          dayNumber: 1, recipes: [
            slot(tofu, 3, MealType.BREAKFAST),
            slot(spaghetti, 2), slot(tofu, 1),      // dinner: exact match
            slot(tofu, 3, MealType.SUPPER),
          ]
        },
        { dayNumber: 2, recipes: [slot(spaghetti, 3)] },               // vegan unfed + missing meals
        {
          dayNumber: 3, recipes: [
            slot(tofu, 3, MealType.BREAKFAST),
            slot(tofu, 5),                           // dinner: all fed, surplus 2
            slot(tofu, 3, MealType.SUPPER),
          ]
        },
      ]);

    const reports = getCruiseCoverage(cruise);
    expect(reports).toHaveLength(3);

    // Day 1: fully covered, no surplus
    expect(reports[0].dayNumber).toBe(1);
    expect(reports[0].isFullyCovered).toBe(true);
    expect(reports[0].hasSurplus).toBe(false);

    // Day 2: vegan unfed (3 meat portions, but vegan can't eat)
    expect(reports[1].dayNumber).toBe(2);
    expect(reports[1].isFullyCovered).toBe(false);
    const day2Dinner = reports[1].meals.find(m => m.mealType === MealType.DINNER)!;
    expect(day2Dinner.unfed).toHaveLength(1);
    expect(day2Dinner.unfed[0].id).toBe('3');

    // Day 3: all fed via vegan recipe, surplus = 5 - 3 = 2
    expect(reports[2].dayNumber).toBe(3);
    expect(reports[2].isFullyCovered).toBe(true);
    expect(reports[2].hasSurplus).toBe(true);
    const day3Dinner = reports[2].meals.find(m => m.mealType === MealType.DINNER)!;
    expect(day3Dinner.surplus).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countCrewWithTag / getActiveDietTags
// ---------------------------------------------------------------------------

describe('countCrewWithTag', () => {
  it('should count members with specified diet', () => {
    const cruise = makeCruise([omni('1'), omni('2'), vegan('3'), veg('4')]);
    expect(countCrewWithTag(cruise, 'omnivore')).toBe(2);
    expect(countCrewWithTag(cruise, 'vegan')).toBe(1);
    expect(countCrewWithTag(cruise, 'vegetarian')).toBe(1);
    expect(countCrewWithTag(cruise, 'gluten-free')).toBe(0);
  });

  it('should return 0 for empty crew', () => {
    expect(countCrewWithTag(makeCruise([]), 'omnivore')).toBe(0);
  });
});

describe('getActiveDietTags', () => {
  it('should return only diets present in crew', () => {
    const cruise = makeCruise([omni('1'), vegan('2')]);
    const tags = getActiveDietTags(cruise);
    expect(tags).toContain('omnivore');
    expect(tags).toContain('vegan');
    expect(tags).not.toContain('vegetarian');
  });

  it('should return empty array for empty crew', () => {
    expect(getActiveDietTags(makeCruise([]))).toEqual([]);
  });
});
