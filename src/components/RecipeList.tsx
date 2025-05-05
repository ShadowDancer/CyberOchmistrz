"use client";

import { getRecipies, isRecipieVegetarian, isRecipieVegan } from '@/lib/recipieData';
import { Recipie, MealType } from '@/types';
import { useState } from 'react';

interface RecipeListProps {
  onSelectRecipie: (recipie: Recipie) => void;
  selectedRecipieId: number | null;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-sm ${star <= score ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function DietBadge({ isVegetarian, isVegan }: { isVegetarian: boolean; isVegan: boolean }) {
  if (isVegan) {
    return <span className="text-xs font-medium text-green-800 bg-green-100 px-1.5 py-0.5 rounded">Wegańskie</span>;
  }
  
  if (isVegetarian) {
    return <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Wegetariańskie</span>;
  }
  
  return null;
}

export default function RecipeList({ onSelectRecipie: onSelectRecipie, selectedRecipieId: selectedRecipieId }: RecipeListProps) {
  const allRecipies = getRecipies();
  const [filteredRecipies, setFilteredRecipies] = useState<Recipie[]>(allRecipies);
  const [filterType, setFilterType] = useState<string>('wszystkie');
  const [filterDiet, setFilterDiet] = useState<'all' | 'vegetarian' | 'vegan'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const uniqueMealTypes = ['wszystkie', ...Object.values(MealType)];
  
  const handleFilterChange = (type: string) => {
    setFilterType(type);
    applyFilters(type, filterDiet);
  };
  
  const handleDietFilterChange = (diet: 'all' | 'vegetarian' | 'vegan') => {
    setFilterDiet(diet);
    applyFilters(filterType, diet);
  };
  
  const applyFilters = (mealType: string, diet: 'all' | 'vegetarian' | 'vegan') => {
    let filtered = allRecipies;
    
    // Apply meal type filter
    if (mealType !== 'wszystkie') {
      filtered = filtered.filter(recipie => recipie.mealType.includes(mealType as MealType));
    }
    
    // Apply dietary filter
    if (diet === 'vegetarian') {
      filtered = filtered.filter(recipie => isRecipieVegetarian(recipie) || isRecipieVegan(recipie));
    } else if (diet === 'vegan') {
      filtered = filtered.filter(recipie => isRecipieVegan(recipie));
    }
    
    setFilteredRecipies(filtered);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 bg-white pt-2 pb-3 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Lista Przepisów</h2>
          <button 
            onClick={toggleFilters}
            className="md:hidden text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {showFilters ? 'Ukryj filtry' : 'Pokaż filtry'}
          </button>
        </div>
        
        <div className={`space-y-3 mt-2 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-wrap gap-2">
            {uniqueMealTypes.map(type => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`px-2.5 py-1 rounded-full text-xs md:text-sm ${
                  filterType === type 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDietFilterChange('all')}
              className={`px-2.5 py-1 rounded-full text-xs md:text-sm ${
                filterDiet === 'all' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => handleDietFilterChange('vegetarian')}
              className={`px-2.5 py-1 rounded-full text-xs md:text-sm ${
                filterDiet === 'vegetarian' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Wegetariańskie
            </button>
            <button
              onClick={() => handleDietFilterChange('vegan')}
              className={`px-2.5 py-1 rounded-full text-xs md:text-sm ${
                filterDiet === 'vegan' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Wegańskie
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow mt-3">
        {filteredRecipies.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Brak przepisów spełniających kryteria
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredRecipies.map(recipie => {
              const isVegetarian = isRecipieVegetarian(recipie);
              const isVegan = isRecipieVegan(recipie);
              
              return (
                <li 
                  key={recipie.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRecipieId === recipie.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => onSelectRecipie(recipie)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="font-semibold text-lg truncate">{recipie.name}</div>
                      {(isVegetarian || isVegan) && (
                        <DietBadge isVegetarian={isVegetarian} isVegan={isVegan} />
                      )}
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500 ml-2 shrink-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="hidden sm:inline">Trudność:</span>
                        <StarRating score={recipie.difficulty} />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{recipie.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">{recipie.mealType.join(', ')}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
} 