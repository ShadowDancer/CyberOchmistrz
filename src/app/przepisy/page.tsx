"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecipeList from '@/components/RecipeList';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipie } from '@/types';
import { getRecipies } from '@/lib/recipieData';

export default function RecipesPage() {
  const [selectedDish, setSelectedDish] = useState<Recipie | null>(null);
  const dishes = getRecipies();

  // Auto-select first dish if no dish is selected
  useEffect(() => {
    if (dishes.length > 0 && !selectedDish) {
      setSelectedDish(dishes[0]);
    }
  }, [dishes, selectedDish]);

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Książka Kucharska</h1>
        <Link 
          href="/przepisy/nowy" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
        >
          Nowy przepis
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-180px)]">
        <div className="w-full md:w-1/3 border rounded-lg p-4 bg-white shadow-sm overflow-hidden">
          <RecipeList 
            onSelectRecipie={setSelectedDish} 
            selectedRecipieId={selectedDish?.id || null} 
          />
        </div>
        
        <div className="w-full md:w-2/3 border rounded-lg bg-white shadow-sm overflow-hidden">
          <RecipeDetail dish={selectedDish} />
        </div>
      </div>
    </main>
  );
} 