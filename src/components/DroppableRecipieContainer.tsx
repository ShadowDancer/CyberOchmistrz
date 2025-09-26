'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Recipie } from '../types';
import DraggableRecipeItem from './DraggableRecipeItem';

interface DroppableRecipieContainerProps {
  dayNumber: number;
  recipes: {
    originalRecipeId: string;
    recipeData?: Recipie;
  }[];
  onEditIngredients: (dayNumber: number, recipe: { originalRecipeId: string; recipeData?: Recipie }, recipeIndex: number) => void;
  onRemoveRecipe: (dayNumber: number, recipe: { originalRecipeId: string; recipeData?: Recipie }, recipeIndex: number) => void;
  isDragging?: boolean;
}

export default function DroppableRecipieContainer({
  dayNumber,
  recipes,
  onEditIngredients,
  onRemoveRecipe,
  isDragging = false
}: DroppableRecipieContainerProps) {
  const { setNodeRef } = useDroppable({
    id: `day-container-${dayNumber}`,
    data: {
      type: 'day',
      dayNumber,
    },
  });

  const sortableIds = recipes.map((recipe, index) => 
    `${dayNumber}-${index}-${recipe.originalRecipeId}`
  );

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-2 rounded-lg ${
        isDragging ? 'border-2 border-gray-300 border-dashed dark:border-gray-600' : ''
      }`}
    >
      {recipes.length === 0 ? (
        <div className={`flex items-center justify-center h-20 text-muted-light text-sm border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800`}>
          Przeciągnij przepis tutaj
        </div>
      ) : (
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {recipes.map((recipe, index) => (
              <DraggableRecipeItem
                key={`${dayNumber}-${index}-${recipe.originalRecipeId}`}
                recipe={recipe}
                index={index}
                dayNumber={dayNumber}
                onEditIngredients={onEditIngredients}
                onRemoveRecipe={onRemoveRecipe}
              />
            ))}
          </ul>
        </SortableContext>
      )}
    </div>
  );
}
