"use client";

import { useState, useEffect } from 'react';
import RecipeList from '@/components/RecipeList';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipie } from '@/types';
import { getDishes } from '@/lib/recipieData';

export default function RecipesPage() {
  const [selectedDish, setSelectedDish] = useState<Recipie | null>(null);
  const dishes = getDishes();

  // Auto-select first dish if no dish is selected
  useEffect(() => {
    if (dishes.length > 0 && !selectedDish) {
      setSelectedDish(dishes[0]);
    }
  }, [dishes, selectedDish]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Książka Kucharska</h1>
      
      <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-180px)]">
        <div className="w-full md:w-1/3 border rounded-lg p-4 bg-white shadow-sm overflow-hidden">
          <RecipeList 
            onSelectDish={setSelectedDish} 
            selectedDishId={selectedDish?.id || null} 
          />
        </div>
        
        <div className="w-full md:w-2/3 border rounded-lg bg-white shadow-sm overflow-hidden">
          <RecipeDetail dish={selectedDish} />
        </div>
      </div>
    </main>
  );
} 