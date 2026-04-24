'use client';

import { useDroppable } from '@dnd-kit/core';
import { getRecipeById } from '../model/recipieData';
import { Recipie } from '../types';
import { DayCoverageReport } from '../model/cruiseDietCoverage';

interface DroppableDayItemProps {
  dayNumber: number;
  recipes: { originalRecipeId: string; recipeData?: Recipie }[];
  isSelected: boolean;
  isOver: boolean;
  onClick: () => void;
  startDate?: string;
  coverageReport?: DayCoverageReport;
}

export default function DroppableDayItem({
  dayNumber,
  recipes,
  isSelected,
  isOver,
  onClick,
  startDate,
  coverageReport,
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

  const dot = getStatusDot(coverageReport);

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
          <h3 className="font-medium text-sm md:text-base flex items-center gap-2">
            <span>Dzień {dayNumber}</span>
            {dot && (
              <span
                className={`w-2 h-2 rounded-full inline-block ${dot.className}`}
                title={dot.title}
                aria-label={dot.title}
              />
            )}
          </h3>
          {dateInfo && (
            <p className="text-xs text-muted-light mt-1">{dateInfo}</p>
          )}
        </div>
        <span className="text-xs md:text-sm text-muted-light">
          {dayRecipes}{' '}
          {dayRecipes === 1
            ? 'przepis'
            : dayRecipes > 1 && dayRecipes < 5
            ? 'przepisy'
            : 'przepisów'}
        </span>
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

function getStatusDot(
  report?: DayCoverageReport,
): { className: string; title: string } | null {
  if (!report) return null;

  const allUnfed = report.meals.flatMap((m) => m.unfed);
  if (allUnfed.length > 0) {
    const first = allUnfed[0];
    const firstName = first.name;
    const rest = allUnfed.length - 1;
    const title =
      rest > 0
        ? `Niedobór: ${firstName} i ${rest} innych`
        : `Niedobór: ${firstName}`;
    return { className: 'bg-red-500', title };
  }

  const totalSurplus = report.meals.reduce((sum, m) => sum + m.surplus, 0);
  if (totalSurplus > 0) {
    return {
      className: 'bg-yellow-500',
      title: `Nadmiar: ${totalSurplus} porcji`,
    };
  }

  return null;
}
