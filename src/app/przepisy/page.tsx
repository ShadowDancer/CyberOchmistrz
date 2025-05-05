"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeList from '@/components/RecipeList';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipie } from '@/types';
import { getRecipies } from '@/lib/recipieData';

export default function RecipesPage() {
  const [selectedDish, setSelectedDish] = useState<Recipie | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const dishes = getRecipies();

  // Auto-select first dish if no dish is selected
  useEffect(() => {
    if (dishes.length > 0 && !selectedDish) {
      setSelectedDish(dishes[0]);
    }
  }, [dishes, selectedDish]);

  // Handle dish selection for mobile view
  const handleSelectDish = (dish: Recipie) => {
    setSelectedDish(dish);
    // Switch to detail view on mobile when a dish is selected
    if (window.innerWidth < 768) {
      setMobileView('detail');
    }
  };

  // Back button for mobile view
  const handleBackToList = () => {
    setMobileView('list');
  };

  return (
    <main className="container mx-auto px-4 py-8 relative flex flex-col h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Książka Kucharska</h1>
        <Link 
          href="/przepisy/nowy" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium flex items-center text-sm md:text-base"
        >
          Nowy przepis
        </Link>
      </div>
      
      {/* Mobile View Controls */}
      <div className="md:hidden flex mb-4">
        <div className="flex justify-between w-full">
          <button 
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2 text-center font-medium border-b-2 ${
              mobileView === 'list' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500'
            }`}
          >
            Lista przepisów
          </button>
          <button 
            onClick={() => setMobileView('detail')}
            className={`flex-1 py-2 text-center font-medium border-b-2 ${
              mobileView === 'detail' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500'
            } ${!selectedDish ? 'opacity-50' : ''}`}
            disabled={!selectedDish}
          >
            Szczegóły przepisu
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow overflow-hidden">
        {/* Recipe List - Hidden on mobile when in detail view */}
        <div className={`w-full md:w-1/3 border rounded-lg p-4 bg-white shadow-sm flex-grow md:flex-grow-0 overflow-hidden ${
          mobileView === 'detail' ? 'hidden md:block' : ''
        }`}>
          <RecipeList 
            onSelectRecipie={handleSelectDish}
            selectedRecipieId={selectedDish?.id || null} 
          />
        </div>
        
        {/* Recipe Detail - Hidden on mobile when in list view */}
        <div className={`w-full md:w-2/3 border rounded-lg bg-white shadow-sm flex-grow md:flex-grow-0 overflow-hidden ${
          mobileView === 'list' ? 'hidden md:block' : ''
        }`}>
          {mobileView === 'detail' && (
            <div className="md:hidden p-2 bg-gray-50 border-b">
              <button 
                onClick={handleBackToList}
                className="flex items-center text-blue-600 font-medium text-sm"
              >
                ← Wróć do listy
              </button>
            </div>
          )}
          <RecipeDetail dish={selectedDish} />
        </div>
      </div>
    </main>
  );
} 