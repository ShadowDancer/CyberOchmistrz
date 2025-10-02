'use client';

import { useDroppable } from '@dnd-kit/core';
import { getRecipeById } from '../model/recipieData';
import { Recipie } from "../types";

interface DroppableDayItemProps {
  dayNumber: number;
  recipes: { originalRecipeId: string; recipeData?: Recipie }[];
  isSelected: boolean;
  isOver: boolean;
  onClick: () => void;
  startDate?: string;
}

export default function DroppableDayItem({
  dayNumber,
  recipes,
  isSelected,
  isOver,
  onClick,
  startDate
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
    date.setDate(date.getDate() + dayNumber - 1); // dayNumber starts from 1
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekdayNames = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
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
          <h3 className="font-medium text-sm md:text-base">Dzień {dayNumber}</h3>
          {dateInfo && (
            <p className="text-xs text-muted-light mt-1">{dateInfo}</p>
          )}
        </div>
        <span className="text-xs md:text-sm text-muted-light">
          {dayRecipes} {dayRecipes === 1 ? 'przepis' :
            dayRecipes > 1 && dayRecipes < 5 ? 'przepisy' : 'przepisów'}
        </span>
      </div>

      {dayRecipes > 0 && (
        <ul className="mt-2 text-xs md:text-sm text-muted">
          {recipes.slice(0, 2).map((recipe, index) => {
            // First try to use the stored recipe data if available
            const recipeData = recipe.recipeData || getRecipeById(recipe.originalRecipeId);
            return (
              <li key={`${recipe.originalRecipeId}-${index}`} className="truncate">
                • {recipeData ? recipeData.name : `Przepis #${recipe.originalRecipeId}`}
              </li>
            );
          })}
          {dayRecipes > 2 && (
            <li className="text-link">
              + {dayRecipes - 2} więcej...
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
