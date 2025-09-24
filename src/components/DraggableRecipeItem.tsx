'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Recipie } from '../types';
import { getRecipeById } from '../model/recipieData';

interface DraggableRecipeItemProps {
  recipe: { 
    originalRecipeId: string;
    recipeData?: Recipie;
  };
  index: number;
  dayNumber: number;
  onEditIngredients: (dayNumber: number, recipe: { originalRecipeId: string; recipeData?: Recipie }, recipeIndex: number) => void;
  onRemoveRecipe: (dayNumber: number, recipe: { originalRecipeId: string; recipeData?: Recipie }, recipeIndex: number) => void;
  isDragging?: boolean;
}

export default function DraggableRecipeItem({
  recipe,
  index,
  dayNumber,
  onEditIngredients,
  onRemoveRecipe,
  isDragging = false
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
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  // First try to use the stored recipe data if available
  const recipeData = recipe.recipeData || getRecipeById(recipe.originalRecipeId);

  return (
    <li 
      ref={setNodeRef}
      style={style}
      className={`p-2 md:p-3 border rounded-lg ${
        isDragging || isSortableDragging ? 'border-blue-500 bg-blue-50' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <span className="font-medium text-sm md:text-base">
              {recipeData ? recipeData.name : `Przepis #${recipe.originalRecipeId}`}
            </span>
            {recipeData && (
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {recipeData.mealType.join(', ')}
              </p>
            )}
          </div>
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 ml-2 touch-none select-none"
            title="Przeciągnij, aby zmienić kolejność"
            style={{ touchAction: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="3" r="1"/>
              <circle cx="3" cy="8" r="1"/>
              <circle cx="3" cy="13" r="1"/>
              <circle cx="8" cy="3" r="1"/>
              <circle cx="8" cy="8" r="1"/>
              <circle cx="8" cy="13" r="1"/>
              <circle cx="13" cy="3" r="1"/>
              <circle cx="13" cy="8" r="1"/>
              <circle cx="13" cy="13" r="1"/>
            </svg>
          </div>
        </div>
        {recipeData && (
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => onEditIngredients(dayNumber, recipe, index)}
              className="text-blue-600 hover:text-blue-800 text-xs md:text-sm px-2 py-1 border border-blue-600 rounded"
            >
              Edytuj składniki
            </button>
            <button
              onClick={() => onRemoveRecipe(dayNumber, recipe, index)}
              className="text-red-600 hover:text-red-800 text-xs md:text-sm px-2 py-1 border border-red-600 rounded"
            >
              Usuń
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
