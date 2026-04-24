'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CrewMember, CruiseDayRecipe, MealType, Recipie } from '../types';
import DraggableRecipeItem from './DraggableRecipeItem';
import { getMealCoverage, MealCoverage } from '../model/cruiseDietCoverage';

interface DroppableRecipieContainerProps {
  dayNumber: number;
  recipes: CruiseDayRecipe[];
  crewMembers: CrewMember[];
  activeDragMealTypes: MealType[] | null;
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

const SLOT_ORDER: MealType[] = [
  MealType.BREAKFAST,
  MealType.DINNER,
  MealType.SUPPER,
  MealType.SNACK,
];

const SLOT_LABEL: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Śniadanie',
  [MealType.DINNER]: 'Obiad',
  [MealType.SUPPER]: 'Kolacja',
  [MealType.SNACK]: 'Przekąski',
};

export default function DroppableRecipieContainer({
  dayNumber,
  recipes,
  crewMembers,
  activeDragMealTypes,
  onEditIngredients,
  onRemoveRecipe,
  onCrewCountChange,
  isDragging = false,
}: DroppableRecipieContainerProps) {
  return (
    <div className="flex flex-col gap-4">
      {SLOT_ORDER.map((slot) => {
        const slotRecipes: { recipe: CruiseDayRecipe; originalIndex: number }[] =
          recipes
            .map((recipe, originalIndex) => ({ recipe, originalIndex }))
            .filter(({ recipe }) => recipe.mealSlot === slot);

        const isGrayedOut =
          activeDragMealTypes !== null && !activeDragMealTypes.includes(slot);

        return (
          <SlotSection
            key={slot}
            slot={slot}
            dayNumber={dayNumber}
            slotRecipes={slotRecipes}
            crewMembers={crewMembers}
            isGrayedOut={isGrayedOut}
            isDragging={isDragging}
            onEditIngredients={onEditIngredients}
            onRemoveRecipe={onRemoveRecipe}
            onCrewCountChange={onCrewCountChange}
          />
        );
      })}
    </div>
  );
}

interface SlotSectionProps {
  slot: MealType;
  dayNumber: number;
  slotRecipes: { recipe: CruiseDayRecipe; originalIndex: number }[];
  crewMembers: CrewMember[];
  isGrayedOut: boolean;
  isDragging: boolean;
  onEditIngredients: DroppableRecipieContainerProps['onEditIngredients'];
  onRemoveRecipe: DroppableRecipieContainerProps['onRemoveRecipe'];
  onCrewCountChange: DroppableRecipieContainerProps['onCrewCountChange'];
}

function SlotSection({
  slot,
  dayNumber,
  slotRecipes,
  crewMembers,
  isGrayedOut,
  isDragging,
  onEditIngredients,
  onRemoveRecipe,
  onCrewCountChange,
}: SlotSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-slot-${dayNumber}-${slot}`,
    data: {
      type: 'day-slot',
      dayNumber,
      mealSlot: slot,
    },
    disabled: isGrayedOut,
  });

  const sortableIds = slotRecipes.map(
    ({ recipe, originalIndex }) =>
      `${dayNumber}-${originalIndex}-${recipe.originalRecipeId}`,
  );

  const coverage: MealCoverage | null =
    slot === MealType.SNACK
      ? null
      : getMealCoverage(
          slotRecipes.map((x) => x.recipe),
          crewMembers,
          slot,
        );

  return (
    <section
      className={`transition-opacity ${
        isGrayedOut ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="font-semibold text-sm md:text-base">
          {SLOT_LABEL[slot]}
        </h4>
        {slot === MealType.SNACK && (
          <span className="text-xs text-muted-light italic">
            nie wliczają się do pokrycia
          </span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[60px] p-2 rounded-lg border-2 ${
          isOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
            : isDragging
            ? 'border-dashed border-gray-300 dark:border-gray-600'
            : 'border-transparent'
        }`}
      >
        {slotRecipes.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-muted-light text-xs md:text-sm border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            Przeciągnij przepis tutaj
          </div>
        ) : (
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {slotRecipes.map(({ recipe, originalIndex }) => (
                <DraggableRecipeItem
                  key={`${dayNumber}-${originalIndex}-${recipe.originalRecipeId}`}
                  recipe={recipe}
                  index={originalIndex}
                  dayNumber={dayNumber}
                  onEditIngredients={onEditIngredients}
                  onRemoveRecipe={onRemoveRecipe}
                  onCrewCountChange={onCrewCountChange}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </div>
      {coverage && (
        <CoverageDisplay coverage={coverage} crewMembers={crewMembers} />
      )}
    </section>
  );
}

interface CoverageDisplayProps {
  coverage: MealCoverage;
  crewMembers: CrewMember[];
}

function CoverageDisplay({ coverage, crewMembers }: CoverageDisplayProps) {
  if (crewMembers.length === 0) {
    return (
      <div className="mt-2 text-xs md:text-sm text-muted-light italic px-2">
        Brak załogi — Dodaj załogantów, aby sprawdzić pokrycie diety
      </div>
    );
  }

  const { unfed, surplus } = coverage;
  const hasUnfed = unfed.length > 0;
  const hasSurplus = surplus > 0;

  if (!hasUnfed && !hasSurplus) {
    return (
      <div className="mt-2 text-xs md:text-sm text-green-700 dark:text-green-400 px-2">
        ✓ Pokryte
      </div>
    );
  }

  const unfedLabel = unfed
    .map((m) => {
      const dietTag = m.tags.find((t) =>
        ['vegetarian', 'vegan'].includes(t),
      );
      const name = m.name ?? 'anonimowy';
      return dietTag ? `${name} (${dietTag})` : name;
    })
    .join(', ');

  return (
    <div className="mt-2 flex flex-col gap-1 px-2">
      {hasUnfed && (
        <div className="text-xs md:text-sm text-red-700 dark:text-red-400">
          ✗ Niedobór: {unfedLabel}
        </div>
      )}
      {hasSurplus && (
        <div className="text-xs md:text-sm text-yellow-700 dark:text-yellow-400">
          ⚠ Nadmiar: {surplus}{' '}
          {surplus === 1 ? 'porcja' : surplus > 1 && surplus < 5 ? 'porcje' : 'porcji'}
        </div>
      )}
    </div>
  );
}
