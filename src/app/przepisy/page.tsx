"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeList from '@/components/RecipeList';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipie } from '@/types';
import { getRecipies } from '@/model/recipieData';

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

  return (
    <main className="container mx-auto px-4 py-8 relative flex flex-col h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Książka Kucharska</h1>
        <Link
          href="/przepisy/dodaj"
          className="btn-primary flex items-center"
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
              mobileView === 'list' ? 'btn-mobile-tab-active' : 'btn-mobile-tab-inactive'
            }`}
          >
            Lista przepisów
          </button>
          <button
            onClick={() => setMobileView('detail')}
            className={`flex-1 py-2 text-center font-medium border-b-2 ${
              mobileView === 'detail' ? 'btn-mobile-tab-active' : 'btn-mobile-tab-inactive'
            } ${!selectedDish ? 'opacity-50' : ''}`}
            disabled={!selectedDish}
          >
            Szczegóły przepisu
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow overflow-hidden">
        {/* Recipe List - Hidden on mobile when in detail view */}
        <div className={`w-full md:w-1/3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm flex-grow md:flex-grow-0 overflow-hidden ${
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
          <RecipeDetail dish={selectedDish} />
        </div>
      </div>
    </main>
  );
}
