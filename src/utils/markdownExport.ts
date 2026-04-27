import { Cruise, MealType } from '../types';
import { getSupplyById } from '../model/supplyData';
import { getDayCoverage, MealCoverage } from '../model/cruiseDietCoverage';
import { declineUnit } from './polishDeclension';
import { Diet, DIET_REGISTRY } from '../model/crew';
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

export function generateMarkdown(cruise: Cruise): string {
  const dayBlocks: string[] = [];

  for (const day of cruise.days) {
    const blocks: string[] = [];
    blocks.push(formatDayHeader(cruise.startDate, day.dayNumber));

    const dayCoverage = getDayCoverage(day.dayNumber, day.recipes, cruise.crewMembers);

    for (const mealType of MEAL_SLOT_ORDER) {
      const slotRecipes = day.recipes.filter(r => r.mealSlot === mealType);
      let slotContent = `## ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

      if (slotRecipes.length === 0) {
        slotContent += '\nBrak przepisów';
        blocks.push(slotContent);
        continue;
      }

      const mealCoverage = dayCoverage.meals.find(m => m.mealType === mealType);
      if (mealCoverage) {
        const warnings: string[] = [];

        if (mealCoverage.unfed.length > 0) {
          warnings.push("\nUWAGA! Braki w kambuzie! Nienakarmieni załoganci:")

          for (const member of mealCoverage.unfed) {
            warnings.push(`- ${member.name}`);
          }

          warnings.push(formatMissingTagLine(mealCoverage.unfedCountByDiet) ?? "");
        }

        if (mealCoverage.surplus > 0) {
          warnings.push(`\nUWAGA! Nadwyżka racji! Nadmiarowa ilość porcji: ${mealCoverage.surplus}`);
        }

        if (warnings.length > 0) {
          slotContent += '\n' + warnings.join('\n');
        }
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
        const lines: string[] = [];

        if (group.length === 1) {
          const recipe = group[0];
          lines.push(`### ${recipe.recipeData.name}.`);
          lines.push("");
          lines.push("Składniki:");
          for (const ing of recipe.recipeData.ingredients) {
            const supply = getSupplyById(ing.id);
            const totalAmount = ing.amount * recipe.crewCount;
            if (supply) {
              lines.push(`- ${totalAmount} ${declineUnit(supply.unit, totalAmount)} ${supply.name}`);
            } else {
              lines.push(`- ${totalAmount} ${ing.id}`);
            }
          }
          lines.push("");
          lines.push("Sposób przygotowania:");
          recipe.recipeData.instructions.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
        } else {
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
          for (const recipe of sortedGroup) {
            lines.push(`Składniki (${recipe.recipeData.name}, ${recipe.crewCount} ${declineUnit('osoba', recipe.crewCount)}):`);
            for (const ing of recipe.recipeData.ingredients) {
              const supply = getSupplyById(ing.id);
              const totalAmount = ing.amount * recipe.crewCount;
              if (supply) {
                lines.push(`- ${totalAmount} ${declineUnit(supply.unit, totalAmount)} ${supply.name}`);
              } else {
                lines.push(`- ${totalAmount} ${ing.id}`);
              }
            }
            lines.push("");
          }
          lines.push("Zmodyfikowana wersja przepisu wymaga od kuka okrętowego inwencji twórczej podczas gotowania!");
          lines.push("");
          const catalogRecipe = getRecipeById(key);
          const instructions = catalogRecipe ? catalogRecipe.instructions : sortedGroup[0].recipeData.instructions;
          lines.push("Sposób przygotowania:");
          instructions.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
        }

        slotContent += '\n\n' + lines.join('\n');
      }

      blocks.push(slotContent);
    }

    dayBlocks.push(blocks.join('\n\n'));
    dayBlocks.push("---")
  }

  return dayBlocks.join('\n\n');
}

function formatMissingTagLine(missingTagCounts: MealCoverage["unfedCountByDiet"]) {
  const parts = (Object.entries(missingTagCounts) as [Diet, number][])
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${DIET_REGISTRY[id].labelLong}: ${n}`);
  return parts.length > 0 ? "Brakuje " + parts.join(', ') : null;
}
