import { AggregatedShoppingList, AggregatedItem, Supply } from '../src/types';
import { generateShoppingListCSV } from '../src/model/cruiseData';

describe('generateShoppingListCSV', () => {
  const createMockSupply = (id: string, name: string, unit: string, category: string, description?: string): Supply => ({
    id,
    name,
    unit,
    category,
    isIngredient: true,
    description
  });

  const createMockAggregatedItem = (supply: Supply, amount: number): AggregatedItem => ({
    supply,
    amount,
    sources: []
  });

  it('should generate CSV with headers for empty shopping list', () => {
    const emptyList: AggregatedShoppingList = {};
    const csv = generateShoppingListCSV(emptyList);

    expect(csv).toBe('Kategoria,Nazwa produktu,Ilość,Jednostka,Opis');
  });

  it('should generate CSV for single item in one category', () => {
    const supply = createMockSupply('1', 'Mleko', 'litry', 'nabiał', 'Świeże mleko');
    const item = createMockAggregatedItem(supply, 2.5);

    const shoppingList: AggregatedShoppingList = {
      'nabiał': [item]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'nabiał,Mleko,2.5,litry,Świeże mleko';

    expect(csv).toBe(expected);
  });

  it('should generate CSV for multiple items in one category', () => {
    const milk = createMockSupply('1', 'Mleko', 'litry', 'nabiał', 'Świeże mleko');
    const cheese = createMockSupply('2', 'Ser', 'kg', 'nabiał');

    const shoppingList: AggregatedShoppingList = {
      'nabiał': [
        createMockAggregatedItem(cheese, 0.5), // Ser comes before Mleko alphabetically
        createMockAggregatedItem(milk, 2.5)
      ]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'nabiał,Ser,0.5,kg,\n' +
                     'nabiał,Mleko,2.5,litry,Świeże mleko';

    expect(csv).toBe(expected);
  });

  it('should generate CSV for multiple categories sorted alphabetically', () => {
    const apple = createMockSupply('1', 'Jabłko', 'kg', 'owoce');
    const milk = createMockSupply('2', 'Mleko', 'litry', 'nabiał');
    const bread = createMockSupply('3', 'Chleb', 'sztuki', 'pieczywo');

    const shoppingList: AggregatedShoppingList = {
      'owoce': [createMockAggregatedItem(apple, 3)],
      'nabiał': [createMockAggregatedItem(milk, 2)],
      'pieczywo': [createMockAggregatedItem(bread, 5)]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'nabiał,Mleko,2,litry,\n' +
                     'owoce,Jabłko,3,kg,\n' +
                     'pieczywo,Chleb,5,sztuki,';

    expect(csv).toBe(expected);
  });

  it('should handle items without descriptions', () => {
    const supply = createMockSupply('1', 'Mąka', 'kg', 'pieczywo');
    const item = createMockAggregatedItem(supply, 1);

    const shoppingList: AggregatedShoppingList = {
      'pieczywo': [item]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'pieczywo,Mąka,1,kg,';

    expect(csv).toBe(expected);
  });

  it('should escape CSV values containing commas', () => {
    const supply = createMockSupply('1', 'Pomidory, koktajlowe', 'kg', 'warzywa');
    const item = createMockAggregatedItem(supply, 2);

    const shoppingList: AggregatedShoppingList = {
      'warzywa': [item]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'warzywa,"Pomidory, koktajlowe",2,kg,';

    expect(csv).toBe(expected);
  });

  it('should escape CSV values containing quotes', () => {
    const supply = createMockSupply('1', 'Mleko "Świeże"', 'litry', 'nabiał');
    const item = createMockAggregatedItem(supply, 1);

    const shoppingList: AggregatedShoppingList = {
      'nabiał': [item]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'nabiał,"Mleko ""Świeże""",1,litry,';

    expect(csv).toBe(expected);
  });

  it('should escape CSV values containing newlines', () => {
    const supply = createMockSupply('1', 'Chleb\nRazowy', 'sztuki', 'pieczywo');
    const item = createMockAggregatedItem(supply, 4);

    const shoppingList: AggregatedShoppingList = {
      'pieczywo': [item]
    };

    const csv = generateShoppingListCSV(shoppingList);
    const expected = 'Kategoria,Nazwa produktu,Ilość,Jednostka,Opis\n' +
                     'pieczywo,"Chleb\nRazowy",4,sztuki,';

    expect(csv).toBe(expected);
  });

  it('should handle complex case with multiple categories and special characters', () => {
    const supplies = [
      createMockSupply('1', 'Mleko "Świeże", ekologiczne', 'litry', 'nabiał', 'Z lokalnej farmy\nBardzo świeże'),
      createMockSupply('2', 'Jabłka, czerwone', 'kg', 'owoce'),
      createMockSupply('3', 'Chleb', 'sztuki', 'pieczywo', 'Razowy'),
      createMockSupply('4', 'Ser "Gouda"', 'kg', 'nabiał')
    ];

    const shoppingList: AggregatedShoppingList = {
      'nabiał': [
        createMockAggregatedItem(supplies[3], 0.8), // Ser comes before Mleko alphabetically
        createMockAggregatedItem(supplies[0], 3.5)
      ],
      'owoce': [createMockAggregatedItem(supplies[1], 2.2)],
      'pieczywo': [createMockAggregatedItem(supplies[2], 6)]
    };

    const csv = generateShoppingListCSV(shoppingList);

    expect(csv).toContain('Kategoria,Nazwa produktu,Ilość,Jednostka,Opis');
    expect(csv).toContain('nabiał,"Ser ""Gouda""",0.8,kg,');
    expect(csv).toContain('nabiał,"Mleko ""Świeże"", ekologiczne",3.5,litry,"Z lokalnej farmy\nBardzo świeże"');
    expect(csv).toContain('owoce,"Jabłka, czerwone",2.2,kg,');
    expect(csv).toContain('pieczywo,Chleb,6,sztuki,Razowy');
  });

  it('should maintain consistent ordering across multiple calls', () => {
    const supplies = [
      createMockSupply('1', 'Cukinia', 'kg', 'warzywa'),
      createMockSupply('2', 'Jabłko', 'kg', 'owoce'),
      createMockSupply('3', 'Mleko', 'litry', 'nabiał')
    ];

    const shoppingList: AggregatedShoppingList = {
      'warzywa': [createMockAggregatedItem(supplies[0], 1)],
      'owoce': [createMockAggregatedItem(supplies[1], 2)],
      'nabiał': [createMockAggregatedItem(supplies[2], 3)]
    };

    const csv1 = generateShoppingListCSV(shoppingList);
    const csv2 = generateShoppingListCSV(shoppingList);

    expect(csv1).toBe(csv2);
  });
});
