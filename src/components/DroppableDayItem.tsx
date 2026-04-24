'use client';

import { useDroppable } from '@dnd-kit/core';
import { getRecipeById } from '../model/recipieData';
import { getMealCoverage, MealCoverage } from '../model/cruiseDietCoverage';
import { CrewMember, CruiseDayRecipe, MealType } from '../types';

const MEAL_SLOT_DOTS: { slot: MealType; label: string }[] = [
  { slot: MealType.BREAKFAST, label: 'Śniadanie' },
  { slot: MealType.DINNER, label: 'Obiad' },
  { slot: MealType.SUPPER, label: 'Kolacja' },
];

interface DroppableDayItemProps {
  dayNumber: number;
  recipes: CruiseDayRecipe[];
  crewMembers: CrewMember[];
  isSelected: boolean;
  isOver: boolean;
  onClick: () => void;
  startDate?: string;
}

export default function DroppableDayItem({
  dayNumber,
  recipes,
  crewMembers,
  isSelected,
  isOver,
  onClick,
  startDate,
}: DroppableDayItemProps) {
  const { setNodeRef } = useDroppable({
    id: `day-list-${dayNumber}`,
    data: {
      type: 'day',
      dayNumber,
    },
  });

  const dayRecipes = recipes.length;

  const getDateInfo = () => {
    if (!startDate) return null;
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayNumber - 1);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekdayNames = [
      'niedziela',
      'poniedziałek',
      'wtorek',
      'środa',
      'czwartek',
      'piątek',
      'sobota',
    ];
    const weekday = weekdayNames[date.getDay()];
    return `${day}.${month} ${weekday}`;
  };

  const dateInfo = getDateInfo();

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`p-2 md:p-3 border rounded-lg cursor-pointer transition-colors dark:border-gray-600 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
          : isOver
          ? 'border-blue-300'
          : ''
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-sm md:text-base">
            <span>Dzień {dayNumber}</span>
          </h3>
          {dateInfo && (
            <p className="text-xs text-muted-light mt-1">{dateInfo}</p>
          )}
        </div>
        <div
          className="grid w-[7.5rem] shrink-0 grid-cols-[auto_1fr] items-center gap-1.5 pl-1 text-xs sm:w-[8rem] sm:gap-2 md:text-sm"
        >
          <span
            className="inline-flex items-center justify-center gap-0.5 self-center"
            role="list"
            aria-label="Status śniadania, obiadu, kolacji"
          >
            {MEAL_SLOT_DOTS.map(({ slot, label }) => {
              const slotRecipes = recipes.filter((r) => r.mealSlot === slot);
              const coverage = getMealCoverage(
                slotRecipes,
                crewMembers,
                slot,
              );
              const dot = mealStatusDot(
                coverage,
                slotRecipes.length === 0,
                label,
              );
              return (
                <span
                  key={slot}
                  role="listitem"
                  className={`w-2 h-2 rounded-full shrink-0 ${dot.className}`}
                  title={dot.title}
                  aria-label={dot.title}
                />
              );
            })}
          </span>
          <span className="min-w-0 text-center text-muted-light tabular-nums leading-tight">
            {dayRecipes}{' '}
            {dayRecipes === 1
              ? 'przepis'
              : dayRecipes > 1 && dayRecipes < 5
              ? 'przepisy'
              : 'przepisów'}
          </span>
        </div>
      </div>

      {dayRecipes > 0 && (
        <ul className="mt-2 text-xs md:text-sm text-muted">
          {recipes.slice(0, 2).map((recipe, index) => {
            const recipeData =
              recipe.recipeData || getRecipeById(recipe.originalRecipeId);
            return (
              <li
                key={`${recipe.originalRecipeId}-${index}`}
                className="truncate"
              >
                • {recipeData ? recipeData.name : `Przepis #${recipe.originalRecipeId}`}
              </li>
            );
          })}
          {dayRecipes > 2 && (
            <li className="text-link">+ {dayRecipes - 2} więcej...</li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Same rules as `CoverageDisplay` in DroppableRecipieContainer (per meal slot). */
function mealStatusDot(
  coverage: MealCoverage,
  isSlotEmpty: boolean,
  mealLabel: string,
): { className: string; title: string } {
  const { totalPortions, totalNeeded, unfed, surplus } = coverage;
  const ratio = `${totalPortions}/${totalNeeded}`;

  if (isSlotEmpty) {
    return {
      className:
        'box-border border-2 border-gray-400 bg-transparent dark:border-gray-500',
      title: `${mealLabel}: ${ratio} - Dodaj racje`,
    };
  }
  if (unfed.length > 0) {
    return {
      className: 'bg-red-500',
      title: `${mealLabel}: ${ratio} - Braki w kambuzie`,
    };
  }
  if (surplus > 0) {
    return {
      className: 'bg-yellow-500',
      title: `${mealLabel}: ${ratio} - Nadwyżka racji`,
    };
  }
  return {
    className: 'bg-green-500',
    title: `${mealLabel}: ${ratio} - Zaprowiantowano`,
  };
}
