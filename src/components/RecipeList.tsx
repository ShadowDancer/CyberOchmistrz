"use client";

import { getDishes, isDishVegetarian, isDishVegan } from '@/lib/recipieData';
import { Recipie, MealType } from '@/types';
import { useState } from 'react';
import { Clock } from 'lucide-react';

interface RecipeListProps {
  onSelectDish: (dish: Recipie) => void;
  selectedDishId: number | null;
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

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} godz`;
  }
  
  return `${hours} godz ${remainingMinutes} min`;
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

export default function RecipeList({ onSelectDish, selectedDishId }: RecipeListProps) {
  const allDishes = getDishes();
  const [filteredDishes, setFilteredDishes] = useState<Recipie[]>(allDishes);
  const [filterType, setFilterType] = useState<string>('wszystkie');
  const [filterDiet, setFilterDiet] = useState<'all' | 'vegetarian' | 'vegan'>('all');
  
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
    let filtered = allDishes;
    
    // Apply meal type filter
    if (mealType !== 'wszystkie') {
      filtered = filtered.filter(dish => dish.mealType.includes(mealType as MealType));
    }
    
    // Apply dietary filter
    if (diet === 'vegetarian') {
      filtered = filtered.filter(dish => isDishVegetarian(dish) || isDishVegan(dish));
    } else if (diet === 'vegan') {
      filtered = filtered.filter(dish => isDishVegan(dish));
    }
    
    setFilteredDishes(filtered);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 sticky top-0 bg-white pt-2 pb-3 z-10">
        <h2 className="text-xl font-bold mb-2">Lista Przepisów</h2>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {uniqueMealTypes.map(type => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`px-3 py-1 rounded-full text-sm ${
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
            className={`px-3 py-1 rounded-full text-sm ${
              filterDiet === 'all' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => handleDietFilterChange('vegetarian')}
            className={`px-3 py-1 rounded-full text-sm ${
              filterDiet === 'vegetarian' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Wegetariańskie
          </button>
          <button
            onClick={() => handleDietFilterChange('vegan')}
            className={`px-3 py-1 rounded-full text-sm ${
              filterDiet === 'vegan' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Wegańskie
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto pr-1 flex-grow h-0 min-h-0">
        <ul className="space-y-2">
          {filteredDishes.map(dish => {
            const isVegetarian = isDishVegetarian(dish);
            const isVegan = isDishVegan(dish);
            
            return (
              <li 
                key={dish.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedDishId === dish.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onSelectDish(dish)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex flex-col space-y-1">
                      <div className="font-semibold text-lg truncate">{dish.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {dish.mealType.join(", ")}
                      </div>
                      <div className="flex items-center mt-1">
                        {(isVegetarian || isVegan) && (
                          <div className="mt-1">
                            <DietBadge isVegetarian={isVegetarian} isVegan={isVegan} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-xs text-gray-500 ml-2">
                    <div className="flex items-center gap-1 mb-1">
                      <span>Trudność:</span>
                      <StarRating score={dish.difficulty} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Smak:</span>
                      <StarRating score={dish.tasteScore} />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{dish.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">Typ: {dish.mealType.join(', ')}</p>
                  <div className="flex items-center text-xs text-gray-500 gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(dish.preparationTime)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 