'use client';

import { useState, useEffect } from 'react';
import { Cruise, Recipie } from '../types';
import { 
  addRecipeToCruiseDay, 
  removeRecipeFromCruiseDay,
  updateRecipeIngredientInCruise,
  addIngredientToRecipeInCruise,
  removeIngredientFromRecipeInCruise,
  getCruiseById
} from '../lib/cruiseData';
import { getRecipeById } from '../lib/recipieData';
import RecipeList from './RecipeList';
import RecipeIngredientEditor from './RecipeIngredientEditor';

interface CruisePlanTabProps {
  cruise: Cruise;
  onCruiseChange: () => void;
}

export default function CruiseMenuTab({ cruise, onCruiseChange }: CruisePlanTabProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedRecipie, setSelectedRecipie] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'days' | 'details' | 'recipes'>('days');
  const [editingRecipe, setEditingRecipe] = useState<{ dayNumber: number, recipeIndex: number, recipe: Recipie } | null>(null);

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

  return (
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
        <div className="space-y-2">
          {cruise.days.map(day => {
            const dayRecipes = day.recipes.length;
            return (
              <div 
                key={day.dayNumber}
                onClick={() => handleDaySelect(day.dayNumber)}
                className={`p-2 md:p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDay === day.dayNumber
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm md:text-base">Dzień {day.dayNumber}</h3>
                  <span className="text-xs md:text-sm text-gray-500">
                    {dayRecipes} {dayRecipes === 1 ? 'przepis' : 
                      dayRecipes > 1 && dayRecipes < 5 ? 'przepisy' : 'przepisów'}
                  </span>
                </div>
                
                {dayRecipes > 0 && (
                  <ul className="mt-2 text-xs md:text-sm text-gray-600">
                    {day.recipes.slice(0, 2).map(recipe => {
                      // First try to use the stored recipe data if available
                      const recipeData = recipe.recipeData || getRecipeById(recipe.originalRecipeId);
                      return (
                        <li key={recipe.originalRecipeId} className="truncate">
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
          })}
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
            {selectedDayData.recipes.length === 0 ? (
              <p className="text-gray-500 italic text-sm md:text-base">
                Brak przepisów na ten dzień. 
                <button 
                  onClick={switchToRecipesView}
                  className="text-blue-600 underline ml-1 md:hidden"
                >
                  Dodaj przepis
                </button>
              </p>
            ) : (
              <div className="space-y-3">
                <h3 className="font-medium text-sm md:text-base">Zaplanowane przepisy:</h3>
                <ul className="space-y-2">
                  {selectedDayData.recipes.map((recipe, index) => {
                    // First try to use the stored recipe data if available
                    const recipeData = recipe.recipeData || getRecipeById(recipe.originalRecipeId);
                    return (
                      <li 
                        key={`${recipe.originalRecipeId}-${index}`} 
                        className="p-2 md:p-3 border rounded-lg"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium text-sm md:text-base">
                                {recipeData ? recipeData.name : `Przepis #${recipe.originalRecipeId}`}
                              </span>
                              {recipeData && (
                                <p className="text-xs md:text-sm text-gray-600 mt-1">
                                  {recipeData.mealType.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          {recipeData && (
                            <div className="flex justify-end gap-2 mt-1">
                              <button
                                onClick={() => handleEditIngredients(selectedDay, recipe, index)}
                                className="text-blue-600 hover:text-blue-800 text-xs md:text-sm px-2 py-1 border border-blue-600 rounded"
                              >
                                Edytuj składniki
                              </button>
                              <button
                                onClick={() => handleRemoveRecipe(selectedDay, recipe, index)}
                                className="text-red-600 hover:text-red-800 text-xs md:text-sm px-2 py-1 border border-red-600 rounded"
                              >
                                Usuń
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
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
  );
} 