'use client';

import { useState, useEffect } from 'react';
import { Cruise, Recipie, CruiseDay } from '../types';
import { 
  getCruiseById, 
  deleteCruise, 
  addRecipeToCruiseDay, 
  removeRecipeFromCruiseDay
} from '../lib/cruiseData';
import { getRecipies, getRecipeById } from '../lib/recipieData';
import { useRouter } from 'next/navigation';
import RecipeList from './RecipeList';
import CruiseSuppliesTab from './CruiseSuppliesTab';
import ShoppingListTab from './ShoppingListTab';
import { getNonIngredients } from '../lib/supplyData';

interface CruiseDetailProps {
  id: string;
}

export default function CruiseDetail({ id }: CruiseDetailProps) {
  const router = useRouter();
  const [cruise, setCruise] = useState<Cruise | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedRecipie, setSelectedRecipie] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'supplies' | 'shopping'>('info');

  useEffect(() => {
    const cruiseData = getCruiseById(id);
    if (cruiseData) {
      // Initialize additionalSupplies array if it doesn't exist
      if (!cruiseData.additionalSupplies) {
        cruiseData.additionalSupplies = [];
      }
      setCruise(cruiseData);
    }
    setLoading(false);
  }, [id]);

  const handleDaySelect = (dayNumber: number) => {
    setSelectedDay(dayNumber === selectedDay ? null : dayNumber);
  };

  const handleRecipieSelect = (recipie: Recipie) => {
    setSelectedRecipie(recipie.id);
    
    // If a day is selected, add the recipie immediately
    if (selectedDay !== null && cruise) {
      addRecipeToCruiseDay(cruise.id, selectedDay, recipie.id);
      
      // Refresh cruise data
      const updatedCruise = getCruiseById(id);
      if (updatedCruise) {
        setCruise(updatedCruise);
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Czy na pewno chcesz usunąć ten rejs?')) {
      deleteCruise(id);
      router.push('/rejsy');
    }
  };

  const handleRemoveRecipe = (dayNumber: number, recipeId: number) => {
    if (!cruise) return;
    
    removeRecipeFromCruiseDay(cruise.id, dayNumber, recipeId);
    
    // Refresh cruise data
    const updatedCruise = getCruiseById(id);
    if (updatedCruise) {
      setCruise(updatedCruise);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSupplyChange = () => {
    // Refresh cruise data
    const updatedCruise = getCruiseById(id);
    if (updatedCruise) {
      setCruise(updatedCruise);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>;
  }

  if (!cruise) {
    return (
      <div className="text-center py-8">
        <p className="text-xl text-gray-700">Nie znaleziono rejsu</p>
        <button 
          onClick={() => router.push('/rejsy')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Wróć do listy rejsów
        </button>
      </div>
    );
  }

  const selectedDayData = selectedDay !== null 
    ? cruise.days.find(day => day.dayNumber === selectedDay) 
    : null;

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">{cruise.name}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/rejsy')}
            className="text-gray-600 hover:text-gray-900"
          >
            Wróć
          </button>
        </div>
      </div>

      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'info' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Informacje
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'plan' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Plan posiłków
          </button>
          <button
            onClick={() => setActiveTab('supplies')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'supplies' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Dodatkowe zakupy
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'shopping' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Lista zakupów
          </button>
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-medium mb-2">Informacje podstawowe</h2>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Utworzono:</span>
                  <span>{formatDate(cruise.dateCreated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ostatnia modyfikacja:</span>
                  <span>{formatDate(cruise.dateModified)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-medium mb-2">Parametry rejsu</h2>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Długość rejsu:</span>
                  <span>{cruise.length} dni</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Liczba załogantów:</span>
                  <span>{cruise.crew} osób</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Usuń rejs
            </button>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
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
      )}

      {activeTab === 'supplies' && (
        <CruiseSuppliesTab
          cruise={cruise}
          onSupplyChange={handleSupplyChange}
        />
      )}

      {activeTab === 'shopping' && (
        <ShoppingListTab cruise={cruise} />
      )}
    </div>
  );
} 