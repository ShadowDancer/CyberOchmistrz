import recipies from '../src/data/recipies.json';
import supplies from '../src/data/supplies.json';

describe('data integrity', () => {
  describe('duplicate IDs', () => {
    it('supplies.json has no duplicate IDs', () => {
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const supply of supplies) {
        if (seen.has(supply.id)) duplicates.push(supply.id);
        else seen.add(supply.id);
      }
      expect(duplicates.join(', ')).toBe('');
    });

    it('recipies.json has no duplicate IDs', () => {
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const recipie of recipies) {
        if (seen.has(recipie.id)) duplicates.push(recipie.id);
        else seen.add(recipie.id);
      }
      expect(duplicates.join(', ')).toBe('');
    });
  });

  describe('ingredient references', () => {
    it('all recipe ingredients refer to existing supplies with isIngredient: true', () => {
      const supplyMap = new Map(supplies.map(s => [s.id, s]));
      const violations: string[] = [];

      for (const recipie of recipies) {
        for (const ingredient of recipie.ingredients) {
          const supply = supplyMap.get(ingredient.id);
          if (!supply) {
            violations.push(`${recipie.id}: ${ingredient.id} (not found in supplies.json)`);
          } else if (!supply.isIngredient) {
            violations.push(`${recipie.id}: ${ingredient.id} (isIngredient is false)`);
          }
        }
      }

      expect(violations.join('\n')).toBe('');
    });
  });
});
