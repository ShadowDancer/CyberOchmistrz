'use client';

import { useState, useEffect } from 'react';
import { Cruise, Recipie } from '../types';
import { 
  addRecipeToCruiseDay, 
  removeRecipeFromCruiseDay,
  updateRecipeIngredientInCruise,
  addIngredientToRecipeInCruise,
  removeIngredientFromRecipeInCruise,
  getCruiseById,
  reorderRecipesInCruiseDay,
  moveRecipeBetweenCruiseDays
} from '../model/cruiseData';
import { getRecipeById } from '../model/recipieData';
import RecipeList from './RecipeList';
import RecipeIngredientEditor from './RecipeIngredientEditor';
import DroppableRecipieContainer from './DroppableRecipieContainer';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DroppableDayItem from './DroppableDayItem';

interface CruisePlanTabProps {
  cruise: Cruise;
  onCruiseChange: () => void;
}

export default function CruiseMenuTab({ cruise, onCruiseChange }: CruisePlanTabProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedRecipie, setSelectedRecipie] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'days' | 'details' | 'recipes'>('days');
  const [editingRecipe, setEditingRecipe] = useState<{ dayNumber: number, recipeIndex: number, recipe: Recipie } | null>(null);
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    if (selectedDay === null && cruise.days.length > 0) {
      const firstDay = cruise.days[0].dayNumber;
      setSelectedDay(firstDay);
    }
  }, [cruise.days, selectedDay]);

  const handleDaySelect = (dayNumber: number) => {
    setSelectedDay(dayNumber === selectedDay ? null : dayNumber);
    // On mobile, switch to day details view when a day is selected
    if (window.innerWidth < 768) {
      setMobileView('details');
    }
  };

  const handleRecipieSelect = (recipie: Recipie) => {
    setSelectedRecipie(recipie.id);
    
    // If a day is selected, add the recipie immediately
    if (selectedDay !== null && cruise) {
      // First get the full recipe details
      const fullRecipe = getRecipeById(recipie.id.toString());
      if (fullRecipe) {
        // Create a deep copy of the recipe to store with the day
        const recipeSnapshot = JSON.parse(JSON.stringify(fullRecipe));
        // Add original recipe ID reference and the recipe copy to the cruise day
        addRecipeToCruiseDay(cruise.id, selectedDay, recipie.id.toString(), recipeSnapshot);
      }
      
      // Trigger parent refresh
      onCruiseChange();
      
      // On mobile, switch back to day details after adding a recipe
      if (window.innerWidth < 768) {
        setMobileView('details');
      }
    }
  };

  const handleRemoveRecipe = (dayNumber: number, recipe: {originalRecipeId: string, recipeData?: Recipie}, recipeIndex: number) => {
    if (!cruise) return;
    
    removeRecipeFromCruiseDay(cruise.id, dayNumber, recipe.originalRecipeId, recipeIndex);
    
    // Trigger parent refresh
    onCruiseChange();
  };

  const handleEditIngredients = (dayNumber: number, recipe: {originalRecipeId: string, recipeData?: Recipie}, recipeIndex: number) => {
    if (!recipe.recipeData) return;
    
    setEditingRecipe({
      dayNumber,
      recipeIndex,
      recipe: recipe.recipeData
    });
  };

  const handleIngredientUpdate = (dayNumber: number, recipeIndex: number, ingredientIndex: number, newAmount: number) => {
    if (!cruise) return;
    
    updateRecipeIngredientInCruise(cruise.id, dayNumber, recipeIndex, ingredientIndex, newAmount);
    onCruiseChange();
    
    // Force UI refresh by updating the editingRecipe state with updated recipe
    if (editingRecipe) {
      const updatedCruise = getCruiseById(cruise.id);
      if (updatedCruise) {
        const dayIndex = updatedCruise.days.findIndex((day) => day.dayNumber === dayNumber);
        if (dayIndex !== -1) {
          const updatedRecipe = updatedCruise.days[dayIndex].recipes[recipeIndex];
          if (updatedRecipe && updatedRecipe.recipeData) {
            setEditingRecipe({
              ...editingRecipe,
              recipe: updatedRecipe.recipeData
            });
          }
        }
      }
    }
  };

  const handleIngredientAdd = (dayNumber: number, recipeIndex: number, ingredientId: string, amount: number) => {
    if (!cruise) return;
    
    addIngredientToRecipeInCruise(cruise.id, dayNumber, recipeIndex, ingredientId, amount);
    onCruiseChange();
    
    // Force UI refresh by updating the editingRecipe state with updated recipe
    if (editingRecipe) {
      const updatedCruise = getCruiseById(cruise.id);
      if (updatedCruise) {
        const dayIndex = updatedCruise.days.findIndex((day) => day.dayNumber === dayNumber);
        if (dayIndex !== -1) {
          const updatedRecipe = updatedCruise.days[dayIndex].recipes[recipeIndex];
          if (updatedRecipe && updatedRecipe.recipeData) {
            setEditingRecipe({
              ...editingRecipe,
              recipe: updatedRecipe.recipeData
            });
          }
        }
      }
    }
  };

  const handleIngredientRemove = (dayNumber: number, recipeIndex: number, ingredientIndex: number) => {
    if (!cruise) return;
    
    removeIngredientFromRecipeInCruise(cruise.id, dayNumber, recipeIndex, ingredientIndex);
    onCruiseChange();
    
    // Force UI refresh by updating the editingRecipe state with updated recipe
    if (editingRecipe) {
      const updatedCruise = getCruiseById(cruise.id);
      if (updatedCruise) {
        const dayIndex = updatedCruise.days.findIndex((day) => day.dayNumber === dayNumber);
        if (dayIndex !== -1) {
          const updatedRecipe = updatedCruise.days[dayIndex].recipes[recipeIndex];
          if (updatedRecipe && updatedRecipe.recipeData) {
            setEditingRecipe({
              ...editingRecipe,
              recipe: updatedRecipe.recipeData
            });
          }
        }
      }
    }
  };

  const closeIngredientEditor = () => {
    setEditingRecipe(null);
  };

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    if (!over || !active.data.current) return;
    
    const activeData = active.data.current;
    const overId = over.id as string;
    
    // Parse active item data
    const sourceDayNumber = activeData.dayNumber;
    const sourceIndex = activeData.index;
    
    // Determine target based on over id
    let targetDayNumber: number;
    let targetIndex: number | undefined;
    
    if (overId.startsWith('day-list-') || overId.startsWith('day-container-')) {
      // Dropped on a day container
      targetDayNumber = parseInt(overId.split('-').pop() || '0');
      targetIndex = undefined; // Will be added to the end
    } else {
      // Dropped on another recipe item
      const overData = over.data.current;
      if (overData) {
        targetDayNumber = overData.dayNumber;
        targetIndex = overData.index;
      } else {
        return; // Invalid drop target
      }
    }
    
    // Handle the drop
    if (sourceDayNumber === targetDayNumber) {
      // Reordering within the same day
      if (targetIndex !== undefined && sourceIndex !== targetIndex) {
        reorderRecipesInCruiseDay(cruise.id, sourceDayNumber, sourceIndex, targetIndex);
        onCruiseChange();
      }
    } else {
      // Moving between different days
      moveRecipeBetweenCruiseDays(cruise.id, sourceDayNumber, targetDayNumber, sourceIndex, targetIndex);
      onCruiseChange();
    }
  };

  // Get the active recipe for drag overlay
  const getActiveRecipe = () => {
    if (!activeId) return null;

    const [dayStr, indexStr] = activeId.split('-');
    const dayNumber = parseInt(dayStr);
    const index = parseInt(indexStr);
    
    const day = cruise.days.find(d => d.dayNumber === dayNumber);
    if (!day || !day.recipes[index]) return null;
    
    return {
      recipe: day.recipes[index],
      index,
      dayNumber
    };
  };

  const selectedDayData = selectedDay !== null 
    ? cruise.days.find(day => day.dayNumber === selectedDay) 
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:grid md:grid-cols-3 h-full">
      {/* Mobile navigation controls */}
      <div className="flex justify-center gap-2 py-2 md:hidden border-b mb-2">
        <button 
          onClick={() => setMobileView('days')}
          className={`px-3 py-1 text-sm rounded-full ${
            mobileView === 'days' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Dni
        </button>
        <button 
          onClick={() => setMobileView('details')}
          className={`px-3 py-1 text-sm rounded-full ${
            mobileView === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          } ${!selectedDay ? 'opacity-50' : ''}`}
          disabled={!selectedDay}
        >
          Szczegóły dnia
        </button>
        <button 
          onClick={() => setMobileView('recipes')}
          className={`px-3 py-1 text-sm rounded-full ${
            mobileView === 'recipes' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          } ${!selectedDay ? 'opacity-50' : ''}`}
          disabled={!selectedDay}
        >
          Przepisy
        </button>
      </div>

      {/* Left Panel - Days */}
      <div className={`border-r p-3 md:p-4 overflow-y-auto ${
        mobileView !== 'days' ? 'hidden md:block' : ''
      }`}>
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Dni rejsu</h2>
        <div className={`min-h-[100px] p-2 rounded-lg transition-colors ${
          !!activeId ? 'border-2 border-gray-300 border-dashed' : ''
        }`}>
          <div className="space-y-2">
            {cruise.days.map(day => (
              <DroppableDayItem
                key={day.dayNumber}
                dayNumber={day.dayNumber}
                recipes={day.recipes}
                isSelected={selectedDay === day.dayNumber}
                isOver={overId === `day-list-${day.dayNumber}`}
                onClick={() => handleDaySelect(day.dayNumber)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Center Panel - Day Details */}
      <div className={`border-r p-3 md:p-4 overflow-y-auto ${
        mobileView !== 'details' ? 'hidden md:block' : ''
      }`}>
        {selectedDay !== null && selectedDayData ? (
          <>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-bold">Dzień {selectedDay}</h2>
              <button 
                onClick={switchToRecipesView}
                className="text-sm bg-blue-600 text-white px-2 py-1 rounded md:hidden"
              >
                Dodaj przepis
              </button>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm md:text-base">Zaplanowane przepisy:</h3>
              <DroppableRecipieContainer
                dayNumber={selectedDay}
                recipes={selectedDayData.recipes}
                onEditIngredients={handleEditIngredients}
                onRemoveRecipe={handleRemoveRecipe}
                isDragging={!!activeId}
              />
              {selectedDayData.recipes.length === 0 && (
                <p className="text-gray-500 italic text-sm md:text-base text-center mt-4">
                  <button 
                    onClick={switchToRecipesView}
                    className="text-blue-600 underline md:hidden"
                  >
                    Dodaj przepis
                  </button>
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-sm md:text-base">
              {mobileView === 'details' ? 
                <button onClick={backToDays} className="text-blue-600">Wybierz dzień z listy</button> :
                'Wybierz dzień z listy po lewej stronie'
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Right Panel - Recipie Selection */}
      <div className={`p-3 md:p-4 overflow-y-auto ${
        mobileView !== 'recipes' ? 'hidden md:block' : ''
      }`}>
        {mobileView === 'recipes' && (
          <div className="mb-3 md:hidden">
            <button
              onClick={backToDetails}
              className="text-blue-600 flex items-center text-sm"
            >
              ← Wróć do szczegółów dnia {selectedDay}
            </button>
          </div>
        )}
        
        {selectedDay !== null ? (
          <RecipeList 
            onSelectRecipie={handleRecipieSelect} 
            selectedRecipieId={selectedRecipie}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-sm md:text-base">
              {mobileView === 'recipes' ? 
                <button onClick={backToDays} className="text-blue-600">Najpierw wybierz dzień</button> :
                'Wybierz dzień, aby dodać przepisy'
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Recipe ingredient editor modal */}
      {editingRecipe && (
        <RecipeIngredientEditor
          recipe={editingRecipe.recipe}
          dayNumber={editingRecipe.dayNumber}
          recipeIndex={editingRecipe.recipeIndex}
          onIngredientUpdate={handleIngredientUpdate}
          onIngredientAdd={handleIngredientAdd}
          onIngredientRemove={handleIngredientRemove}
          onClose={closeIngredientEditor}
        />
      )}
      </div>
      
      {/* Drag overlay */}
      <DragOverlay style={{ zIndex: 1000, opacity: 0.5 }}>
        {activeRecipe ? (
          <div className="p-2 md:p-3 border rounded-lg bg-blue-50 border-blue-500">
            <div className="flex items-center">
              <div className="flex-1">
                <span className="font-medium text-sm md:text-base">
                  {activeRecipe.recipe.recipeData ? activeRecipe.recipe.recipeData.name : `Przepis #${activeRecipe.recipe.originalRecipeId}`}
                </span>
                {activeRecipe.recipe.recipeData && (
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
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
