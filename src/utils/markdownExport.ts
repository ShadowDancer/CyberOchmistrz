import { Cruise, CruiseDayRecipe, MealType } from '../types';
import { getSupplyById } from '../model/supplyData';
import { declineUnit } from './polishDeclension';
import { getRecipeById } from '../model/recipieData';

const MEAL_SLOT_ORDER = [MealType.BREAKFAST, MealType.DINNER, MealType.SUPPER, MealType.SNACK];

const POLISH_WEEKDAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const POLISH_MONTHS = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

function formatDayHeader(startDate: string | undefined, dayNumber: number): string {
  if (!startDate) return `# Dzień ${dayNumber}`;
  const [y, m, d] = startDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + (dayNumber - 1));
  return `# ${POLISH_WEEKDAYS[date.getDay()]}, ${date.getDate()} ${POLISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatIngredient(id: string, totalAmount: number): string {
  const supply = getSupplyById(id);
  if (supply) {
    return `- ${totalAmount} ${declineUnit(supply.unit, totalAmount)} ${supply.name}`;
  }
  return `- ${totalAmount} ${id}`;
}

function generateSingleRecipeLines(group: CruiseDayRecipe[]): string[] {
  const recipe = group[0];
  const lines: string[] = [];
  lines.push(`### ${recipe.recipeData.name}.`);
  lines.push("");
  lines.push("Składniki:");
  for (const ing of recipe.recipeData.ingredients) {
    lines.push(formatIngredient(ing.id, ing.amount * recipe.crewCount));
  }
  lines.push("");
  lines.push("Sposób przygotowania:");
  recipe.recipeData.instructions.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  return lines;
}

function generateVariantRecipeLines(group: CruiseDayRecipe[], key: string): string[] {
  const lines: string[] = [];
  const sortedGroup = [...group].sort((a, b) => b.crewCount - a.crewCount);

  const seenNames = new Set<string>();
  const uniqueNames: string[] = [];
  for (const r of sortedGroup) {
    if (!seenNames.has(r.recipeData.name)) {
      seenNames.add(r.recipeData.name);
      uniqueNames.push(r.recipeData.name);
    }
  }
  lines.push(`### ${uniqueNames.join(' / ')}.`);
  lines.push("");

  const commonIds = sortedGroup[0].recipeData.ingredients
    .map(ing => ing.id)
    .filter(id => sortedGroup.every(r => r.recipeData.ingredients.some(ing => ing.id === id)));

  for (const recipe of sortedGroup) {
    const distinctIngs = recipe.recipeData.ingredients.filter(ing => !commonIds.includes(ing.id));
    lines.push(`Składniki specyficzne dla wariantu (${recipe.recipeData.name}, ${recipe.crewCount} ${declineUnit('osoba', recipe.crewCount)}):`);
    if (distinctIngs.length === 0) {
      lines.push("- Ten wariant przepisu korzysta tylko ze wspólnych składników");
    } else {
      for (const ing of distinctIngs) {
        lines.push(formatIngredient(ing.id, ing.amount * recipe.crewCount));
      }
    }
    lines.push("");
  }

  lines.push("Wspólne składniki:");
  for (const id of commonIds) {
    const totalAmount = sortedGroup.reduce((sum, r) => {
      const ing = r.recipeData.ingredients.find(i => i.id === id);
      return sum + (ing ? ing.amount * r.crewCount : 0);
    }, 0);
    lines.push(formatIngredient(id, totalAmount));
  }
  lines.push("");

  lines.push("Zmodyfikowana wersja przepisu wymaga od kuka okrętowego inwencji twórczej podczas gotowania!");
  lines.push("");

  const catalogRecipe = getRecipeById(key);
  const instructions = catalogRecipe ? catalogRecipe.instructions : sortedGroup[0].recipeData.instructions;
  lines.push("Sposób przygotowania:");
  instructions.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });

  return lines;
}

export function generateMarkdown(cruise: Cruise): string {
  const dayBlocks: string[] = [];

  for (const day of cruise.days) {
    const blocks: string[] = [];
    blocks.push(formatDayHeader(cruise.startDate, day.dayNumber));

    for (const mealType of MEAL_SLOT_ORDER) {
      const slotRecipes = day.recipes.filter(r => r.mealSlot === mealType);
      let slotContent = `## ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

      if (slotRecipes.length === 0) {
        slotContent += '\nBrak przepisów';
        blocks.push(slotContent);
        continue;
      }

      const groupOrder: string[] = [];
      const groups = new Map<string, typeof slotRecipes>();
      for (const recipe of slotRecipes) {
        const key = recipe.originalRecipeId;
        if (!groups.has(key)) {
          groupOrder.push(key);
          groups.set(key, []);
        }
        groups.get(key)!.push(recipe);
      }

      for (const key of groupOrder) {
        const group = groups.get(key)!;
        const lines = group.length === 1
          ? generateSingleRecipeLines(group)
          : generateVariantRecipeLines(group, key);

        slotContent += '\n\n' + lines.join('\n');
      }

      blocks.push(slotContent);
    }

    dayBlocks.push(blocks.join('\n\n'));
    dayBlocks.push("---")
  }

  return dayBlocks.join('\n\n');
}

