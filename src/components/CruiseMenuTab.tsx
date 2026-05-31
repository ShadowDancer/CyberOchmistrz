'use client';

import { useState, useEffect } from 'react';
import {
  getCruiseById,
} from '../model/cruiseData';
import { getRecipeById } from '../model/recipieData';
import { generateMarkdown } from '../utils/markdownExport';
import RecipeList from './RecipeList';
import RecipeIngredientEditor from './RecipeIngredientEditor';
import DroppableRecipieContainer from './DroppableRecipieContainer';
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DroppableDayItem from './DroppableDayItem';
import { Recipie, MealType } from '@/model/recipe';

export default function CruiseMenuTab() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'days' | 'details' | 'recipes'>('days');
  const [editingRecipe, setEditingRecipe] = useState<{ dayNumber: number; recipeIndex: number; recipe: Recipie } | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const collisionDetection: CollisionDetection = (args) => {
    const activeType = args.active?.data.current?.type;
    if (activeType === 'catalog-recipe') {
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) return pointerCollisions;
      return rectIntersection(args);
    }
    return closestCenter(args);
  };

  useEffect(() => {
    if (selectedDay === null && cruise.days.length > 0) {
      const firstDay = cruise.days[0].dayNumber;
      setSelectedDay(firstDay);
    }
  }, [cruise.days, selectedDay]);

  const handleDaySelect = (dayNumber: number) => {
    setSelectedDay(dayNumber === selectedDay ? null : dayNumber);
    if (window.innerWidth < 768) {
      setMobileView('details');
    }
  };

  const handleRemoveRecipe = (
    dayNumber: number,
    recipe: { originalRecipeId: string; recipeData?: Recipie },
    recipeIndex: number,
  ) => {
    if (!cruise) return;
    cruise.removeRecipe(dayNumber, recipe.originalRecipeId, recipeIndex)
    onCruiseChange();
  };

  const handleEditIngredients = (
    dayNumber: number,
    recipe: { originalRecipeId: string; recipeData?: Recipie },
    recipeIndex: number,
  ) => {
    if (!recipe.recipeData) return;

    setEditingRecipe({
      dayNumber,
      recipeIndex,
      recipe: recipe.recipeData,
    });
  };

  const handleCrewCountChange = (
    dayNumber: number,
    recipeIndex: number,
    crewCount: number,
  ) => {
    if (!cruise) return;
    cruise.updateCruiseDayRecipe(dayNumber, recipeIndex, (recipe) => {
      recipe.crewCount = crewCount;
    })
    onCruiseChange();
  };

  const handleSaveRecipeEdits = (
    dayNumber: number,
    recipeIndex: number,
    name: string,
    ingredients: Array<{ id: string; amount: number }>,
  ) => {
    if (!cruise) return;
    cruise.updateCruiseDayRecipe(dayNumber, recipeIndex, (recipe) => {
      recipe.recipeData.name = name;
      recipe.recipeData.ingredients = ingredients;
    })
    onCruiseChange();
  };

  const closeIngredientEditor = () => {
    setEditingRecipe(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId((event.over?.id as string) || null);
  };

  const parseSlotDroppable = (id: string): { dayNumber: number; mealSlot: MealType } | null => {
    if (!id.startsWith('day-slot-')) return null;
    const rest = id.substring('day-slot-'.length);
    const dashIdx = rest.indexOf('-');
    if (dashIdx === -1) return null;
    const dayNum = parseInt(rest.substring(0, dashIdx), 10);
    const mealSlotStr = rest.substring(dashIdx + 1);
    if (isNaN(dayNum)) return null;
    const mealSlot = Object.values(MealType).find((m) => m === mealSlotStr) as MealType | undefined;
    if (!mealSlot) return null;
    return { dayNumber: dayNum, mealSlot };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || !active.data.current) return;

    const activeData = active.data.current;
    const overId = over.id as string;
    const overData = over.data.current;

    // --- Catalog recipe → slot section ---
    if (activeData.type === 'catalog-recipe') {
      if (selectedDay === null) return;

      let targetDay: number | null = null;
      let targetSlot: MealType | null = null;

      const slotInfo = parseSlotDroppable(overId);
      if (slotInfo) {
        targetDay = slotInfo.dayNumber;
        targetSlot = slotInfo.mealSlot;
      } else if (overData?.type === 'recipe' && typeof overData.dayNumber === 'number') {
        targetDay = overData.dayNumber;
        targetSlot = overData.mealSlot as MealType;
      }

      if (targetDay === null || targetSlot === null) return;
      if (targetDay !== selectedDay) return;

      const recipeId: string = activeData.recipeId;
      const fullRecipe = getRecipeById(recipeId);
      if (!fullRecipe) return;

      const recipeSnapshot = JSON.parse(JSON.stringify(fullRecipe));
      cruise.insertRecipe(targetDay, {
        crewCount: Math.max(1, cruise.crewMembers.length),
        mealSlot: targetSlot,
        originalRecipeId: recipeId,
        recipeData: recipeSnapshot
      })
      onCruiseChange();
      return;
    }

    // --- Existing recipe dragged ---
    if (activeData.type !== 'recipe') return;

    const sourceDayNumber: number = activeData.dayNumber;
    const sourceIndex: number = activeData.index;
    const sourceMealSlot: MealType = activeData.mealSlot;

    let targetDayNumber: number | undefined;
    let targetMealSlot: MealType | undefined;
    let targetIndex: number | undefined;

    const slotInfo = parseSlotDroppable(overId);
    if (slotInfo) {
      targetDayNumber = slotInfo.dayNumber;
      targetMealSlot = slotInfo.mealSlot;
      targetIndex = undefined;
    } else if (overId.startsWith('day-list-')) {
      targetDayNumber = parseInt(overId.split('-').pop() || '0', 10);
      targetMealSlot = sourceMealSlot;
      targetIndex = undefined;
    } else if (overData?.type === 'recipe') {
      targetDayNumber = overData.dayNumber;
      targetMealSlot = overData.mealSlot;
      targetIndex = overData.index;
    } else {
      return;
    }

    if (targetDayNumber === undefined || !targetMealSlot) return;

    if (sourceDayNumber === targetDayNumber) {
      if (sourceMealSlot !== targetMealSlot) {
        cruise.updateCruiseDayRecipe(sourceDayNumber, sourceIndex, (recipe) => {
          recipe.mealSlot = targetMealSlot;
        })
        onCruiseChange();
        return;
      }
      if (targetIndex !== undefined && sourceIndex !== targetIndex) {
        cruise.reorderRecipes(sourceDayNumber, sourceIndex, targetIndex)
        onCruiseChange();
      }
      return;
    }

    cruise.moveRecipeBetweenDays(sourceDayNumber, targetDayNumber, sourceIndex, targetIndex)

    if (sourceMealSlot !== targetMealSlot) {
      const updatedCruise = getCruiseById(cruise.id);
      if (updatedCruise) {
        const targetDay = updatedCruise.days.find((d) => d.dayNumber === targetDayNumber);
        if (targetDay) {
          const insertedIndex =
            targetIndex !== undefined && targetIndex >= 0 && targetIndex < targetDay.recipes.length
              ? targetIndex
              : targetDay.recipes.length - 1;

          cruise.updateCruiseDayRecipe(targetDayNumber, insertedIndex, (recipe) => {
            recipe.mealSlot = targetMealSlot;
          });
        }
      }
    }
    onCruiseChange();
  };

  const getActiveRecipe = () => {
    if (!activeId) return null;

    if (activeId.startsWith('catalog-')) {
      const recipeId = activeId.slice('catalog-'.length);
      const fullRecipe = getRecipeById(recipeId);
      if (!fullRecipe) return null;
      return {
        recipe: { originalRecipeId: recipeId, recipeData: fullRecipe },
        index: -1,
        dayNumber: -1,
      };
    }

    const [dayStr, indexStr] = activeId.split('-');
    const dayNumber = parseInt(dayStr, 10);
    const index = parseInt(indexStr, 10);

    const day = cruise.days.find((d) => d.dayNumber === dayNumber);
    if (!day || !day.recipes[index]) return null;

    return {
      recipe: day.recipes[index],
      index,
      dayNumber,
    };
  };

  const selectedDayData = selectedDay !== null
    ? cruise.days.find((day) => day.dayNumber === selectedDay)
    : null;

  const switchToRecipesView = () => {
    setMobileView('recipes');
  };

  const backToDays = () => {
    setMobileView('days');
  };

  const backToDetails = () => {
    setMobileView('details');
  };

  const activeRecipe = getActiveRecipe();

  const exportToMarkdown = () => {
    const markdown = generateMarkdown(cruise);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cruise-menu-${cruise.name}-${new Date().toISOString()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:grid md:grid-cols-3 h-full">
        <div className="flex justify-center gap-2 py-2 md:hidden border-b dark:border-gray-600 mb-2">
          <button
            onClick={() => setMobileView('days')}
            className={`btn-filter ${mobileView === 'days' ? 'btn-filter-active' : 'btn-filter-inactive'}`}
          >
            Dni
          </button>
          <button
            onClick={() => setMobileView('details')}
            className={`btn-filter ${mobileView === 'details' ? 'btn-filter-active' : 'btn-filter-inactive'} ${!selectedDay ? 'opacity-50' : ''}`}
            disabled={!selectedDay}
          >
            Szczegóły dnia
          </button>
          <button
            onClick={() => setMobileView('recipes')}
            className={`btn-filter ${mobileView === 'recipes' ? 'btn-filter-active' : 'btn-filter-inactive'} ${!selectedDay ? 'opacity-50' : ''}`}
            disabled={!selectedDay}
          >
            Przepisy
          </button>
        </div>

        <div
          className={`border-r p-3 md:p-4 overflow-y-auto ${
            mobileView !== 'days' ? 'hidden md:block' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold">Dni rejsu</h2>
            <button onClick={exportToMarkdown} className="btn-secondary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Eksportuj do pliku
            </button>
          </div>
          <div
            className={`space-y-4 max-h-[70vh] overflow-y-auto ${
              !!activeId ? 'border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-lg p-2' : ''
            }`}
          >
            {cruise.days.map((day) => (
              <DroppableDayItem
                key={day.dayNumber}
                dayNumber={day.dayNumber}
                recipes={day.recipes}
                crewMembers={cruise.crewMembers}
                isSelected={selectedDay === day.dayNumber}
                isOver={overId === `day-list-${day.dayNumber}`}
                onClick={() => handleDaySelect(day.dayNumber)}
                startDate={cruise.startDate}
              />
            ))}
          </div>
        </div>

        <div
          className={`border-r p-3 md:p-4 overflow-y-auto ${
            mobileView !== 'details' ? 'hidden md:block' : ''
          }`}
        >
          {selectedDay !== null && selectedDayData ? (
            <>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-bold">Dzień {selectedDay}</h2>
                <button onClick={switchToRecipesView} className="btn-primary btn-small md:hidden">
                  Dodaj przepis
                </button>
              </div>
              <div className="space-y-3">
                <DroppableRecipieContainer
                  dayNumber={selectedDay}
                  recipes={selectedDayData.recipes}
                  crewMembers={cruise.crewMembers}
                  onEditIngredients={handleEditIngredients}
                  onRemoveRecipe={handleRemoveRecipe}
                  onCrewCountChange={handleCrewCountChange}
                  isDragging={!!activeId}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-light">
              <p className="text-sm md:text-base">
                {mobileView === 'details' ? (
                  <button onClick={backToDays} className="text-link">
                    Wybierz dzień z listy
                  </button>
                ) : (
                  'Wybierz dzień z listy po lewej stronie'
                )}
              </p>
            </div>
          )}
        </div>

        <div
          className={`p-3 md:p-4 overflow-y-auto ${
            mobileView !== 'recipes' ? 'hidden md:block' : ''
          }`}
        >
          {mobileView === 'recipes' && (
            <div className="mb-3 md:hidden">
              <button onClick={backToDetails} className="text-link flex items-center text-sm">
                ← Wróć do szczegółów dnia {selectedDay}
              </button>
            </div>
          )}

          {selectedDay !== null ? (
            <RecipeList onSelectRecipie={() => undefined} selectedRecipieId={null} isDraggable />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-light">
              <p className="text-sm md:text-base">
                {mobileView === 'recipes' ? (
                  <button onClick={backToDays} className="text-link">
                    Najpierw wybierz dzień
                  </button>
                ) : (
                  'Wybierz dzień, aby dodać przepisy'
                )}
              </p>
            </div>
          )}
        </div>

        {editingRecipe && (
          <RecipeIngredientEditor
            recipe={editingRecipe.recipe}
            dayNumber={editingRecipe.dayNumber}
            recipeIndex={editingRecipe.recipeIndex}
            onSave={handleSaveRecipeEdits}
            onClose={closeIngredientEditor}
          />
        )}
      </div>

      <DragOverlay
        style={{ zIndex: 1000, opacity: 0.5 }}
        dropAnimation={activeId?.startsWith('catalog-') ? null : undefined}
      >
        {activeRecipe ? (
          <div className="p-2 md:p-3 border rounded-lg bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400">
            <div className="flex items-center">
              <div className="flex-1">
                <span className="font-medium text-sm md:text-base">
                  {activeRecipe.recipe.recipeData
                    ? activeRecipe.recipe.recipeData.name
                    : `Przepis #${activeRecipe.recipe.originalRecipeId}`}
                </span>
                {activeRecipe.recipe.recipeData && (
                  <p className="text-xs md:text-sm text-muted mt-1">
                    {activeRecipe.recipe.recipeData.mealType.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
