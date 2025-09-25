"use client";

import { getRecipies, isRecipieVegetarian, isRecipieVegan } from '@/model/recipieData';
import { Recipie, MealType } from '@/types';
import { useState } from 'react';
import StarRating from './StarRating';

interface RecipeListProps {
  onSelectRecipie: (recipie: Recipie) => void;
  selectedRecipieId: string | null;
}

function DietBadge({ isVegetarian, isVegan }: { isVegetarian: boolean; isVegan: boolean }) {
  if (isVegan) {
    return <span className="badge-vegan">Wegańskie</span>;
  }

  if (isVegetarian) {
    return <span className="badge-vegetarian">Wegetariańskie</span>;
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
                className={`btn-filter ${
                  filterType === type
                    ? 'btn-filter-active'
                    : 'btn-filter-inactive'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDietFilterChange('all')}
              className={`btn-filter ${
                filterDiet === 'all'
                  ? 'bg-green-600 text-white'
                  : 'btn-filter-inactive'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => handleDietFilterChange('vegetarian')}
              className={`btn-filter ${
                filterDiet === 'vegetarian'
                  ? 'bg-green-600 text-white'
                  : 'btn-filter-inactive'
              }`}
            >
              Wegetariańskie
            </button>
            <button
              onClick={() => handleDietFilterChange('vegan')}
              className={`btn-filter ${
                filterDiet === 'vegan'
                  ? 'bg-green-600 text-white'
                  : 'btn-filter-inactive'
              }`}
            >
              Wegańskie
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow mt-3">
        {filteredRecipies.length === 0 ? (
          <div className="text-center text-muted-light py-8">
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
                  className={`list-item ${
                    selectedRecipieId === recipie.id ? 'list-item-selected' : ''
                  }`}
                  onClick={() => onSelectRecipie(recipie)}
                >
                  <div className="recipe-item">
                    <div className="recipe-name">
                      <div className="recipe-name-text">{recipie.name}</div>
                      {(isVegetarian || isVegan) && (
                        <DietBadge isVegetarian={isVegetarian} isVegan={isVegan} />
                      )}
                    </div>
                    <div className="recipe-rating">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="hidden sm:inline">Trudność:</span>
                        <StarRating score={recipie.difficulty} size="small" />
                      </div>
                    </div>
                  </div>
                  <p className="recipe-description">{recipie.description}</p>
                  <div className="recipe-types">
                    <p className="recipe-types-text">{recipie.mealType.join(', ')}</p>
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
