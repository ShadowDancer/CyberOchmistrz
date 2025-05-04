'use client';

import { useState } from 'react';
import { Cruise, Recipie } from '../types';
import { addRecipeToCruiseDay, removeRecipeFromCruiseDay } from '../lib/cruiseData';
import { getRecipeById } from '../lib/recipieData';
import RecipeList from './RecipeList';

interface CruisePlanTabProps {
  cruise: Cruise;
  onCruiseChange: () => void;
}

export default function CruisePlanTab({ cruise, onCruiseChange }: CruisePlanTabProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedRecipie, setSelectedRecipie] = useState<number | null>(null);

  const handleDaySelect = (dayNumber: number) => {
    setSelectedDay(dayNumber === selectedDay ? null : dayNumber);
  };

  const handleRecipieSelect = (recipie: Recipie) => {
    setSelectedRecipie(recipie.id);
    
    // If a day is selected, add the recipie immediately
    if (selectedDay !== null && cruise) {
      addRecipeToCruiseDay(cruise.id, selectedDay, recipie.id);
      
      // Trigger parent refresh
      onCruiseChange();
    }
  };

  const handleRemoveRecipe = (dayNumber: number, recipeId: number) => {
    if (!cruise) return;
    
    removeRecipeFromCruiseDay(cruise.id, dayNumber, recipeId);
    
    // Trigger parent refresh
    onCruiseChange();
  };

  const selectedDayData = selectedDay !== null 
    ? cruise.days.find(day => day.dayNumber === selectedDay) 
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-220px)]">
      {/* Left Panel - Days */}
      <div className="border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Dni rejsu</h2>
        <div className="space-y-2">
          {cruise.days.map(day => {
            const dayRecipes = day.recipes.length;
            return (
              <div 
                key={day.dayNumber}
                onClick={() => handleDaySelect(day.dayNumber)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDay === day.dayNumber
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Dzień {day.dayNumber}</h3>
                  <span className="text-sm text-gray-500">
                    {dayRecipes} {dayRecipes === 1 ? 'przepis' : 
                      dayRecipes > 1 && dayRecipes < 5 ? 'przepisy' : 'przepisów'}
                  </span>
                </div>
                
                {dayRecipes > 0 && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {day.recipes.slice(0, 2).map(recipeId => {
                      const recipe = getRecipeById(recipeId);
                      return (
                        <li key={recipeId} className="truncate">
                          • {recipe ? recipe.name : `Przepis #${recipeId}`}
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
      <div className="border-r p-4 overflow-y-auto">
        {selectedDay !== null && selectedDayData ? (
          <>
            <h2 className="text-xl font-bold mb-4">Dzień {selectedDay}</h2>
            {selectedDayData.recipes.length === 0 ? (
              <p className="text-gray-500 italic">
                Brak przepisów na ten dzień. Wybierz przepis z panelu po prawej stronie.
              </p>
            ) : (
              <div className="space-y-3">
                <h3 className="font-medium">Zaplanowane przepisy:</h3>
                <ul className="space-y-2">
                  {selectedDayData.recipes.map(recipeId => {
                    const recipe = getRecipeById(recipeId);
                    return (
                      <li 
                        key={recipeId} 
                        className="p-3 border rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">
                            {recipe ? recipe.name : `Przepis #${recipeId}`}
                          </span>
                          {recipe && (
                            <p className="text-sm text-gray-600 mt-1">
                              {recipe.mealType.join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveRecipe(selectedDay, recipeId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Usuń
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Wybierz dzień z listy po lewej stronie</p>
          </div>
        )}
      </div>
      
      {/* Right Panel - Recipie Selection */}
      <div className="p-4 overflow-y-auto">
        {selectedDay !== null ? (
          <RecipeList 
            onSelectRecipie={handleRecipieSelect} 
            selectedRecipieId={selectedRecipie}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Wybierz dzień, aby dodać przepisy</p>
          </div>
        )}
      </div>
    </div>
  );
} 