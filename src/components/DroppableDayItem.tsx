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
}

export default function DroppableDayItem({
  dayNumber,
  recipes,
  isSelected,
  isOver,
  onClick
}: DroppableDayItemProps) {
  const { setNodeRef } = useDroppable({
    id: `day-list-${dayNumber}`,
    data: {
      type: 'day',
      dayNumber,
    },
  });

  const dayRecipes = recipes.length;

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
        <h3 className="font-medium text-sm md:text-base">Dzień {dayNumber}</h3>
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
            <li className="text-blue-600">
              + {dayRecipes - 2} więcej...
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
