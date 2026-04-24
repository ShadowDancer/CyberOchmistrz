'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CruiseDayRecipe, Recipie } from '../types';
import { getRecipeById } from '../model/recipieData';

interface DraggableRecipeItemProps {
  recipe: CruiseDayRecipe;
  index: number;
  dayNumber: number;
  onEditIngredients: (
    dayNumber: number,
    recipe: { originalRecipeId: string; recipeData?: Recipie },
    recipeIndex: number,
  ) => void;
  onRemoveRecipe: (
    dayNumber: number,
    recipe: { originalRecipeId: string; recipeData?: Recipie },
    recipeIndex: number,
  ) => void;
  onCrewCountChange: (
    dayNumber: number,
    recipeIndex: number,
    crewCount: number,
  ) => void;
  isDragging?: boolean;
}

export default function DraggableRecipeItem({
  recipe,
  index,
  dayNumber,
  onEditIngredients,
  onRemoveRecipe,
  onCrewCountChange,
  isDragging = false,
}: DraggableRecipeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `${dayNumber}-${index}-${recipe.originalRecipeId}`,
    data: {
      type: 'recipe',
      recipe,
      index,
      dayNumber,
      mealSlot: recipe.mealSlot,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const recipeData = recipe.recipeData || getRecipeById(recipe.originalRecipeId);

  const crewCount = recipe.crewCount;
  const canDecrement = crewCount > 1;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`p-2 md:p-3 border rounded-lg dark:border-gray-600 ${
        isDragging || isSortableDragging ? 'border-blue-500' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-muted hover:text-gray-600 dark:text-gray-500 dark:hover:text-muted touch-none select-none"
            title="Przeciągnij, aby zmienić kolejność lub posiłek"
            style={{ touchAction: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="3" r="1" />
              <circle cx="3" cy="8" r="1" />
              <circle cx="3" cy="13" r="1" />
              <circle cx="8" cy="3" r="1" />
              <circle cx="8" cy="8" r="1" />
              <circle cx="8" cy="13" r="1" />
              <circle cx="13" cy="3" r="1" />
              <circle cx="13" cy="8" r="1" />
              <circle cx="13" cy="13" r="1" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm md:text-base">
              {recipeData ? recipeData.name : `Przepis #${recipe.originalRecipeId}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                canDecrement && onCrewCountChange(dayNumber, index, crewCount - 1)
              }
              disabled={!canDecrement}
              className="btn-secondary btn-small px-2 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Zmniejsz liczbę porcji"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-sm md:text-base tabular-nums">
              {crewCount}
            </span>
            <button
              type="button"
              onClick={() => onCrewCountChange(dayNumber, index, crewCount + 1)}
              className="btn-secondary btn-small px-2"
              aria-label="Zwiększ liczbę porcji"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          {recipeData && (
            <button
              onClick={() => onEditIngredients(dayNumber, recipe, index)}
              className="btn-primary px-2 py-1 text-xs md:text-sm"
            >
              Edytuj składniki
            </button>
          )}
          <button
            onClick={() => onRemoveRecipe(dayNumber, recipe, index)}
            className="btn-remove px-2 py-1 text-xs md:text-sm"
          >
            Usuń
          </button>
        </div>
      </div>
    </li>
  );
}
