import { aggregateShoppingList } from '../src/model/cruiseData';
import { Cruise, Recipie, AggregatedShoppingList } from '../src/types';

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
  }
]);

describe('aggregateShoppingList', () => {
  it('should return empty list for cruise with no recipes or additional supplies', () => {
    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 3,
      crew: 2,
      days: [
        { dayNumber: 1, recipes: [] },
        { dayNumber: 2, recipes: [] },
        { dayNumber: 3, recipes: [] }
      ]
    };

    const result = aggregateShoppingList(cruise);

    expect(result).toEqual({});
  });

  it('should aggregate ingredients from recipes scaled by crew size', () => {
    const recipe: Recipie = {
      id: 'jajecznica',
      name: 'Jajecznica',
      ingredients: [
        { id: 'jajka', amount: 3 }, // 3 eggs
        { id: 'sol', amount: 1 }, // 1g salt
        { id: 'pieprz', amount: 1 }, // 1g pepper
        { id: 'chleb', amount: 0.15 }, // 0.15 bread
        { id: 'maslo', amount: 2 } // 2g butter
      ],
      description: 'Pyszna. Na jachcie może być konieczność robienia na 2 tury.',
      mealType: ['śniadanie', 'kolacja'],
      difficulty: 3,
      instructions: ['Każdy umie zrobić jajecznicę.'],
      developedBy: 'Przemysław Onak'
    };

    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 1,
      crew: 4, // Scale by 4
      days: [
        { dayNumber: 1, recipes: [{ originalRecipeId: 'jajecznica', recipeData: recipe }] }
      ]
    };

    const result = aggregateShoppingList(cruise);

    expect(result).toHaveProperty('nabiał');
    expect(result).toHaveProperty('przyprawy');
    expect(result).toHaveProperty('pieczywo');

    const eggsItem = result['nabiał'].find(item => item.supply.id === 'jajka');
    expect(eggsItem).toBeDefined();
    expect(eggsItem!.amount).toBe(12); // 3 * 4
    expect(eggsItem!.sources).toHaveLength(1);
    expect(eggsItem!.sources[0]).toEqual({
      type: 'recipe',
      amount: 12,
      recipeName: 'Jajecznica',
      dayNumber: 1
    });

    const butterItem = result['nabiał'].find(item => item.supply.id === 'maslo');
    expect(butterItem!.amount).toBe(8); // 2 * 4

    const saltItem = result['przyprawy'].find(item => item.supply.id === 'sol');
    expect(saltItem!.amount).toBe(4); // 1 * 4

    const breadItem = result['pieczywo'].find(item => item.supply.id === 'chleb');
    expect(breadItem!.amount).toBe(0.6); // 0.15 * 4
  });

  it('should aggregate additional supplies', () => {
    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 1,
      crew: 2,
      days: [{ dayNumber: 1, recipes: [] }],
      additionalSupplies: [
        { id: 'woda_butelkowana', amount: 6 }, // 6 bottles of water
        { id: 'papier_toaletowy', amount: 4 }, // 4 rolls of toilet paper
        { id: 'mydło', amount: 2 } // 2 soaps
      ]
    };

    const result = aggregateShoppingList(cruise);

    expect(result).toHaveProperty('napoje');
    expect(result).toHaveProperty('środki czystości');

    const waterItem = result['napoje'][0];
    expect(waterItem.supply.name).toBe('Woda butelkowana');
    expect(waterItem.amount).toBe(6);
    expect(waterItem.sources).toHaveLength(1);
    expect(waterItem.sources[0]).toEqual({
      type: 'additional',
      amount: 6
    });

    const toiletPaperItem = result['środki czystości'].find(item => item.supply.id === 'papier_toaletowy');
    expect(toiletPaperItem!.amount).toBe(4);

    const soapItem = result['środki czystości'].find(item => item.supply.id === 'mydło');
    expect(soapItem!.amount).toBe(2);
  });

  it('should combine ingredients from recipes and additional supplies', () => {
    const recipe: Recipie = {
      id: 'pesto-z-tuczykiem',
      name: 'Pesto z tuńczykiem',
      ingredients: [
        { id: 'tunczyk_w_sosie_wlasnym', amount: 75 },
        { id: 'makaron_penne', amount: 90 },
        { id: 'pesto', amount: 40 }
      ],
      description: 'Szybkie i dobre, łatwo zrobić nawet na fali.',
      mealType: ['obiad'],
      difficulty: 2,
      instructions: ['Gotujemy i cedzimy makaron', 'Dodajemy tuńczyka i pesto, mieszamy'],
      developedBy: 'Przemysław Onak'
    };

    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 1,
      crew: 3,
      days: [{ dayNumber: 1, recipes: [{ originalRecipeId: 'pesto-z-tuczykiem', recipeData: recipe }] }],
      additionalSupplies: [{ id: 'woda_butelkowana', amount: 9 }] // 9 bottles of water
    };

    const result = aggregateShoppingList(cruise);

    expect(result).toHaveProperty('ryby');
    expect(result).toHaveProperty('zboża');
    expect(result).toHaveProperty('inne');
    expect(result).toHaveProperty('napoje');

    const tunaItem = result['ryby'][0];
    expect(tunaItem.amount).toBe(225); // 75 * 3

    const pastaItem = result['zboża'][0];
    expect(pastaItem.amount).toBe(270); // 90 * 3

    const pestoItem = result['inne'][0];
    expect(pestoItem.amount).toBe(120); // 40 * 3

    const waterItem = result['napoje'][0];
    expect(waterItem.amount).toBe(9);
  });

  it('should accumulate amounts for same supply from multiple sources', () => {
    const recipe1: Recipie = {
      id: 'jajecznica',
      name: 'Jajecznica',
      ingredients: [{ id: 'jajka', amount: 3 }],
      description: 'Test',
      mealType: [],
      difficulty: 1,
      instructions: [],
      developedBy: 'Test'
    };

    const recipe2: Recipie = {
      id: 'pesto-z-tuczykiem-i-parmezanem',
      name: 'Pesto z tuńczykiem i parmezanem',
      ingredients: [{ id: 'jajka', amount: 2 }], // Same ingredient, different amount
      description: 'Test',
      mealType: [],
      difficulty: 1,
      instructions: [],
      developedBy: 'Test'
    };

    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 2,
      crew: 2,
      days: [
        { dayNumber: 1, recipes: [{ originalRecipeId: 'jajecznica', recipeData: recipe1 }] },
        { dayNumber: 2, recipes: [{ originalRecipeId: 'pesto-z-tuczykiem-i-parmezanem', recipeData: recipe2 }] }
      ],
      additionalSupplies: [{ id: 'jajka', amount: 6 }] // Additional eggs
    };

    const result = aggregateShoppingList(cruise);

    const eggsItem = result['nabiał'][0];
    expect(eggsItem.amount).toBe(16); // (3 + 2) * 2 + 6 = 6 + 4 + 6
    expect(eggsItem.sources).toHaveLength(3);
    expect(eggsItem.sources[0]).toEqual({
      type: 'recipe',
      amount: 6,
      recipeName: 'Jajecznica',
      dayNumber: 1
    });
    expect(eggsItem.sources[1]).toEqual({
      type: 'recipe',
      amount: 4,
      recipeName: 'Pesto z tuńczykiem i parmezanem',
      dayNumber: 2
    });
    expect(eggsItem.sources[2]).toEqual({
      type: 'additional',
      amount: 6
    });
  });

  it('should sort items alphabetically within categories', () => {
    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 1,
      crew: 1,
      days: [{ dayNumber: 1, recipes: [] }],
      additionalSupplies: [
        { id: 'papier_toaletowy', amount: 1 },
        { id: 'mydło', amount: 1 }
      ]
    };

    const result = aggregateShoppingList(cruise);

    expect(result['środki czystości']).toHaveLength(2);
    expect(result['środki czystości'][0].supply.name).toBe('Mydło'); // M before P
    expect(result['środki czystości'][1].supply.name).toBe('Papier toaletowy');
  });

  it('should handle missing supplies gracefully', () => {
    const recipe: Recipie = {
      id: 'recipe-1',
      name: 'Test Recipe',
      ingredients: [{ id: 'missing-ing', amount: 1 }],
      description: 'Test',
      mealType: [],
      difficulty: 1,
      instructions: [],
      developedBy: 'Test'
    };

    const cruise: Cruise = {
      id: 'test-cruise',
      name: 'Test Cruise',
      dateCreated: '2023-01-01T00:00:00.000Z',
      dateModified: '2023-01-01T00:00:00.000Z',
      length: 1,
      crew: 2,
      days: [{ dayNumber: 1, recipes: [{ originalRecipeId: 'recipe-1', recipeData: recipe }] }],
      additionalSupplies: [{ id: 'missing-supply', amount: 3 }]
    };

    const result = aggregateShoppingList(cruise);

    expect(result).toHaveProperty('Nieprawidłowe produkty');
    expect(result['Nieprawidłowe produkty']).toHaveLength(2);

    const invalidIngredient = result['Nieprawidłowe produkty'].find(item => item.supply.id === 'missing-ing');
    expect(invalidIngredient).toBeDefined();
    expect(invalidIngredient!.supply.name).toBe('Nieprawidłowy produkt: missing-ing');
    expect(invalidIngredient!.amount).toBe(2); // 1 * 2 crew

    const invalidSupply = result['Nieprawidłowe produkty'].find(item => item.supply.id === 'missing-supply');
    expect(invalidSupply).toBeDefined();
    expect(invalidSupply!.supply.name).toBe('Nieprawidłowy produkt: missing-supply');
    expect(invalidSupply!.amount).toBe(3);
  });
});
