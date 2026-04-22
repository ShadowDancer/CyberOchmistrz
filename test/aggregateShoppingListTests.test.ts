import { aggregateShoppingList } from '../src/model/cruiseData';
import { createRecipie } from '../src/model/recipieData';
import { Cruise, CruiseDay, CruiseSupply, Recipie, IngredientAmount, AggregatedShoppingList, AmountSource, RecipeAmountSource, AdditionalSupplyAmountSource, CrewMember, MealType, CruiseDayRecipe } from '../src/types';

// Mock the supplies data
jest.mock('../src/data/supplies.json', () => [
  {
    id: 'jajka',
    name: 'Jajka',
    unit: 'sztuki',
    category: 'nabiał',
    isIngredient: true,
    isVegetarian: true,
    isVegan: false
  },
  {
    id: 'sol',
    name: 'Sól',
    unit: 'gramy',
    category: 'przyprawy',
    isIngredient: true,
    isVegetarian: true,
    isVegan: true
  },
  {
    id: 'pieprz',
    name: 'Pieprz',
    unit: 'gramy',
    category: 'przyprawy',
    isIngredient: true,
    isVegetarian: true,
    isVegan: true
  },
  {
    id: 'chleb',
    name: 'Chleb',
    unit: 'sztuki',
    category: 'pieczywo',
    isIngredient: true,
    isVegetarian: true,
    isVegan: true
  },
  {
    id: 'maslo',
    name: 'Masło',
    unit: 'gramy',
    category: 'nabiał',
    isIngredient: true,
    isVegetarian: true,
    isVegan: false
  },
  {
    id: 'tunczyk_w_sosie_wlasnym',
    name: 'Tuńczyk w sosie własnym',
    unit: 'gramy',
    category: 'ryby',
    isIngredient: true,
    isVegetarian: false,
    isVegan: false
  },
  {
    id: 'makaron_penne',
    name: 'Makaron Penne',
    unit: 'gramy',
    category: 'zboża',
    isIngredient: true,
    isVegetarian: true,
    isVegan: true
  },
  {
    id: 'pesto',
    name: 'Pesto zielone',
    unit: 'gramy',
    category: 'inne',
    isIngredient: true,
    isVegetarian: true,
    isVegan: true
  },
  {
    id: 'parmezan',
    name: 'Parmezan',
    unit: 'gramy',
    category: 'sery',
    isIngredient: true,
    isVegetarian: true,
    isVegan: false
  },
  {
    id: 'woda_butelkowana',
    name: 'Woda butelkowana',
    unit: 'sztuki',
    category: 'napoje',
    isIngredient: false
  },
  {
    id: 'papier_toaletowy',
    name: 'Papier toaletowy',
    unit: 'rolki',
    category: 'środki czystości',
    isIngredient: false
  },
  {
    id: 'mydło',
    name: 'Mydło',
    unit: 'sztuki',
    category: 'środki czystości',
    isIngredient: false
  },
  {
    id: 'no_cat_ingredient',
    name: 'Mystery Ingredient',
    unit: 'gramy',
    isIngredient: true
  },
  {
    id: 'no_cat_supply',
    name: 'Mystery Supply',
    unit: 'sztuki',
    isIngredient: false
  }
]);

describe('aggregateShoppingList', () => {
  const item = (id: string, amount: number, unit: string | null, sources?: AmountSource[]) =>
    expect.objectContaining({
      supply: expect.objectContaining({ id, ...(unit && { unit }) }),
      amount,
      ...(sources && { sources }),
    });

  const recipeSource = (p: { perPerson: number; recipe: string; day: number; crewCount: number }) =>
    new RecipeAmountSource(p.perPerson, p.recipe, p.day, p.crewCount);

  const additionalSupplySource = (p: { base: number; perPerson: boolean; perDay: boolean }) =>
    new AdditionalSupplyAmountSource(p.base, p.perPerson, p.perDay);

  const makeCrewMembers = (count: number): CrewMember[] =>
    Array.from({ length: count }, (_, i) => ({ id: `c${i}`, tags: ['omnivore'] }));

  const makeRecipe = (name: string, ingredients: IngredientAmount[]): Recipie =>
    createRecipie({
      id: name,
      name,
      ingredients,
      description: '',
      mealType: [],
      difficulty: 1,
      instructions: [],
    });

  const dayRecipe = (recipe: Recipie, crewCount: number): CruiseDayRecipe => ({
    originalRecipeId: recipe.id,
    recipeData: recipe,
    crewCount,
    mealSlot: MealType.DINNER,
  });

  const makeCruise = (p: { length: number; crewCount: number; days: CruiseDay[]; additionalSupplies?: CruiseSupply[] }): Cruise => ({
    id: 'test-cruise',
    name: 'Test Cruise',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateModified: '2023-01-01T00:00:00.000Z',
    length: p.length,
    crewMembers: makeCrewMembers(p.crewCount),
    days: p.days,
    additionalSupplies: p.additionalSupplies,
  });

  it('should return empty list for cruise with no recipes or additional supplies', () => {
    const result = aggregateShoppingList(makeCruise({
      length: 3,
      crewCount: 2,
      days: [
        { dayNumber: 1, recipes: [] },
        { dayNumber: 2, recipes: [] },
        { dayNumber: 3, recipes: [] },
      ],
    }));

    expect(result).toEqual({});
  });

  it('should aggregate ingredients from recipes scaled by crewCount', () => {
    const jajecznica = makeRecipe('Jajecznica', [
      { id: 'jajka', amount: 3 },
      { id: 'sol', amount: 1 },
      { id: 'pieprz', amount: 1 },
      { id: 'chleb', amount: 0.15 },
      { id: 'maslo', amount: 2 },
    ]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 4,
      days: [{ dayNumber: 1, recipes: [dayRecipe(jajecznica, 4)] }],
    }));

    expect(result).toEqual(expect.objectContaining({
      'nabiał': expect.arrayContaining([
        item('jajka', 12, 'sztuki', [recipeSource({ perPerson: 3, recipe: 'Jajecznica', day: 1, crewCount: 4 })]),
        item('maslo', 8, 'gramy'),
      ]),
      'przyprawy': expect.arrayContaining([item('sol', 4, 'gramy')]),
      'pieczywo': expect.arrayContaining([item('chleb', 0.6, 'sztuki')]),
    }));
  });

  it('should aggregate additional supplies', () => {
    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 2,
      days: [{ dayNumber: 1, recipes: [] }],
      additionalSupplies: [
        { id: 'woda_butelkowana', amount: 6, isPerPerson: false, isPerDay: false },
        { id: 'papier_toaletowy', amount: 4, isPerPerson: false, isPerDay: false },
        { id: 'mydło', amount: 2, isPerPerson: false, isPerDay: false },
      ],
    }));

    expect(result).toEqual(expect.objectContaining({
      'napoje': expect.arrayContaining([
        item('woda_butelkowana', 6, 'sztuki', [additionalSupplySource({ base: 6, perPerson: false, perDay: false })]),
      ]),
      'środki czystości': expect.arrayContaining([
        item('papier_toaletowy', 4, 'rolki'),
        item('mydło', 2, 'sztuki'),
      ]),
    }));
  });

  it('should combine ingredients from recipes and additional supplies', () => {
    const pesto = makeRecipe('Pesto z tuńczykiem', [
      { id: 'tunczyk_w_sosie_wlasnym', amount: 75 },
      { id: 'makaron_penne', amount: 90 },
      { id: 'pesto', amount: 40 },
    ]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 3,
      days: [{ dayNumber: 1, recipes: [dayRecipe(pesto, 3)] }],
      additionalSupplies: [{ id: 'woda_butelkowana', amount: 9, isPerPerson: false, isPerDay: false }],
    }));

    expect(result).toEqual(expect.objectContaining({
      'ryby': expect.arrayContaining([item('tunczyk_w_sosie_wlasnym', 225, 'gramy')]),
      'zboża': expect.arrayContaining([item('makaron_penne', 270, 'gramy')]),
      'inne': expect.arrayContaining([item('pesto', 120, 'gramy')]),
      'napoje': expect.arrayContaining([item('woda_butelkowana', 9, 'sztuki')]),
    }));
  });

  it('should accumulate amounts for same supply from multiple sources', () => {
    const jajecznica = makeRecipe('Jajecznica', [{ id: 'jajka', amount: 3 }]);
    const pesto = makeRecipe('Pesto z tuńczykiem i parmezanem', [{ id: 'jajka', amount: 2 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 2,
      crewCount: 2,
      days: [
        { dayNumber: 1, recipes: [dayRecipe(jajecznica, 2)] },
        { dayNumber: 2, recipes: [dayRecipe(pesto, 2)] },
      ],
      additionalSupplies: [{ id: 'jajka', amount: 6, isPerPerson: false, isPerDay: false }],
    }));

    expect(result).toEqual(expect.objectContaining({
      'nabiał': expect.arrayContaining([
        item('jajka', 16, 'sztuki', [
          recipeSource({ perPerson: 3, recipe: 'Jajecznica', day: 1, crewCount: 2 }),
          recipeSource({ perPerson: 2, recipe: 'Pesto z tuńczykiem i parmezanem', day: 2, crewCount: 2 }),
          additionalSupplySource({ base: 6, perPerson: false, perDay: false }),
        ]),
      ]),
    }));
  });

  it('should sort items alphabetically within categories', () => {
    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 1,
      days: [{ dayNumber: 1, recipes: [] }],
      additionalSupplies: [
        { id: 'papier_toaletowy', amount: 1, isPerPerson: false, isPerDay: false },
        { id: 'mydło', amount: 1, isPerPerson: false, isPerDay: false },
      ],
    }));

    expect(result['środki czystości']).toHaveLength(2);
    expect(result['środki czystości'][0].supply.name).toBe('Mydło'); // M before P
    expect(result['środki czystości'][1].supply.name).toBe('Papier toaletowy');
  });

  it('should handle missing supplies gracefully', () => {
    const testRecipe = makeRecipe('Test Recipe', [{ id: 'missing-ing', amount: 1 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 2,
      days: [{ dayNumber: 1, recipes: [dayRecipe(testRecipe, 2)] }],
      additionalSupplies: [{ id: 'missing-supply', amount: 3, isPerPerson: false, isPerDay: false }],
    }));

    expect(result).toEqual(expect.objectContaining({
      'Nieprawidłowe produkty': expect.arrayContaining([
        item('missing-ing', 2, null),
        item('missing-supply', 3, null),
      ]),
    }));
  });

  it('should handle multiple additional supplies with different flags', () => {
    const result = aggregateShoppingList(makeCruise({
      length: 5,
      crewCount: 3,
      days: [{ dayNumber: 1, recipes: [] }],
      additionalSupplies: [
        { id: 'woda_butelkowana', amount: 2, isPerPerson: false, isPerDay: false },
        { id: 'woda_butelkowana', amount: 1, isPerPerson: true, isPerDay: false },
        { id: 'woda_butelkowana', amount: 1, isPerPerson: false, isPerDay: true },
        { id: 'woda_butelkowana', amount: 1, isPerPerson: true, isPerDay: true },
        { id: 'papier_toaletowy', amount: 2, isPerPerson: true, isPerDay: false },
      ],
    }));

    expect(result).toEqual(expect.objectContaining({
      'napoje': expect.arrayContaining([
        item('woda_butelkowana', 25, 'sztuki', [
          additionalSupplySource({ base: 2, perPerson: false, perDay: false }),
          additionalSupplySource({ base: 1, perPerson: true, perDay: false }),
          additionalSupplySource({ base: 1, perPerson: false, perDay: true }),
          additionalSupplySource({ base: 1, perPerson: true, perDay: true }),
        ]),
      ]),
      'środki czystości': expect.arrayContaining([
        item('papier_toaletowy', 6, 'rolki', [
          additionalSupplySource({ base: 2, perPerson: true, perDay: false }),
        ]),
      ]),
    }));
  });

  it('should accumulate same recipe across multiple days', () => {
    const jajecznica = makeRecipe('Jajecznica', [{ id: 'jajka', amount: 3 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 3,
      crewCount: 2,
      days: [
        { dayNumber: 1, recipes: [dayRecipe(jajecznica, 2)] },
        { dayNumber: 2, recipes: [] },
        { dayNumber: 3, recipes: [dayRecipe(jajecznica, 2)] },
      ],
    }));

    expect(result).toEqual(expect.objectContaining({
      'nabiał': expect.arrayContaining([
        item('jajka', 12, 'sztuki', [
          recipeSource({ perPerson: 3, recipe: 'Jajecznica', day: 1, crewCount: 2 }),
          recipeSource({ perPerson: 3, recipe: 'Jajecznica', day: 3, crewCount: 2 }),
        ]),
      ]),
    }));
  });

  it('should accumulate shared ingredients from multiple recipes on same day', () => {
    const jajecznica = makeRecipe('Jajecznica', [
      { id: 'sol', amount: 2 },
      { id: 'jajka', amount: 3 },
    ]);
    const kanapki = makeRecipe('Kanapki', [
      { id: 'sol', amount: 1 },
      { id: 'chleb', amount: 2 },
    ]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 4,
      days: [{
        dayNumber: 1,
        recipes: [dayRecipe(jajecznica, 4), dayRecipe(kanapki, 4)],
      }],
    }));

    expect(result).toEqual(expect.objectContaining({
      'przyprawy': expect.arrayContaining([
        item('sol', 12, 'gramy', [
          recipeSource({ perPerson: 2, recipe: 'Jajecznica', day: 1, crewCount: 4 }),
          recipeSource({ perPerson: 1, recipe: 'Kanapki', day: 1, crewCount: 4 }),
        ]),
      ]),
    }));
  });

  it('should use category fallback for supplies without category', () => {
    const mysteryRecipe = makeRecipe('Mystery', [{ id: 'no_cat_ingredient', amount: 5 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 1,
      days: [{ dayNumber: 1, recipes: [dayRecipe(mysteryRecipe, 1)] }],
      additionalSupplies: [{ id: 'no_cat_supply', amount: 3, isPerPerson: false, isPerDay: false }],
    }));

    expect(result['inne']).toEqual(expect.arrayContaining([
      item('no_cat_ingredient', 5, 'gramy'),
    ]));
    expect(result['Pozostałe produkty']).toEqual(expect.arrayContaining([
      item('no_cat_supply', 3, 'sztuki'),
    ]));
  });

  it('should use cruise.length for perDay scaling, not days array length', () => {
    const result = aggregateShoppingList(makeCruise({
      length: 5,
      crewCount: 2,
      days: [{ dayNumber: 1, recipes: [] }],
      additionalSupplies: [
        { id: 'woda_butelkowana', amount: 2, isPerPerson: false, isPerDay: true },
      ],
    }));

    expect(result).toEqual(expect.objectContaining({
      'napoje': expect.arrayContaining([
        item('woda_butelkowana', 10, 'sztuki', [
          additionalSupplySource({ base: 2, perPerson: false, perDay: true }),
        ]),
      ]),
    }));
  });

  it('should include zero-amount ingredients in the list (current behavior)', () => {
    const recipe = makeRecipe('Empty Eggs', [{ id: 'jajka', amount: 0 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 3,
      days: [{ dayNumber: 1, recipes: [dayRecipe(recipe, 3)] }],
    }));

    expect(result).toEqual(expect.objectContaining({
      'nabiał': expect.arrayContaining([
        item('jajka', 0, 'sztuki', [
          recipeSource({ perPerson: 0, recipe: 'Empty Eggs', day: 1, crewCount: 3 }),
        ]),
      ]),
    }));
  });

  it('should scale two recipes on the same day independently by their own crewCount', () => {
    const breakfast = makeRecipe('Jajecznica', [{ id: 'jajka', amount: 3 }]);
    const dinner = makeRecipe('Kanapki', [{ id: 'chleb', amount: 2 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 6,
      days: [{
        dayNumber: 1,
        recipes: [dayRecipe(breakfast, 4), dayRecipe(dinner, 6)],
      }],
    }));

    expect(result['nabiał']).toEqual(expect.arrayContaining([
      item('jajka', 12, 'sztuki'),  // 3 × 4
    ]));
    expect(result['pieczywo']).toEqual(expect.arrayContaining([
      item('chleb', 12, 'sztuki'),  // 2 × 6
    ]));
  });

  it('should contribute nothing when recipe has crewCount=0', () => {
    const recipe = makeRecipe('Jajecznica', [{ id: 'jajka', amount: 3 }]);

    const result = aggregateShoppingList(makeCruise({
      length: 1,
      crewCount: 4,
      days: [{ dayNumber: 1, recipes: [dayRecipe(recipe, 0)] }],
    }));

    expect(result).toEqual({});
  });

  it('should handle original and modified versions of same recipe with independent crewCount', () => {
    const original = makeRecipe('Bolognese', [{ id: 'tunczyk_w_sosie_wlasnym', amount: 100 }]);
    const modified = makeRecipe('Bolognese', [{ id: 'pesto', amount: 50 }]);
    modified.id = 'Bolognese-modified';

    const recipes: CruiseDayRecipe[] = [
      { originalRecipeId: 'Bolognese', recipeData: original, crewCount: 3, mealSlot: MealType.DINNER },
      { originalRecipeId: 'Bolognese', recipeData: modified, crewCount: 2, mealSlot: MealType.DINNER },
    ];

    const result = aggregateShoppingList({
      id: 'c', name: 'c', dateCreated: '', dateModified: '',
      length: 1,
      crewMembers: makeCrewMembers(5),
      days: [{ dayNumber: 1, recipes }],
    });

    expect(result['ryby']).toEqual(expect.arrayContaining([item('tunczyk_w_sosie_wlasnym', 300, 'gramy')]));
    expect(result['inne']).toEqual(expect.arrayContaining([item('pesto', 100, 'gramy')]));
  });
});
