"use client";

import { getRecipies, isRecipieVegetarian, isRecipieVegan } from '@/model/recipieData';
import { Recipie, MealType } from '@/types';
import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import StarRating from './StarRating';

interface RecipeListProps {
  onSelectRecipie: (recipie: Recipie) => void;
  selectedRecipieId: string | null;
  isDraggable?: boolean;
}

interface RecipeListItemProps {
  recipie: Recipie;
  isSelected: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isDraggable: boolean;
  onSelect: () => void;
}

function RecipeListItem({ recipie, isSelected, isVegetarian, isVegan, isDraggable, onSelect }: RecipeListItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${recipie.id}`,
    data: {
      type: 'catalog-recipe',
      recipeId: recipie.id,
    },
    disabled: !isDraggable,
  });

  return (
    <li
      ref={isDraggable ? setNodeRef : undefined}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      style={isDraggable ? { touchAction: 'none', opacity: isDragging ? 0.5 : 1 } : undefined}
      className={`list-item ${isSelected ? 'list-item-selected' : ''} ${
        isDraggable ? 'cursor-grab active:cursor-grabbing select-none' : ''
      }`}
      onClick={isDraggable ? undefined : onSelect}
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

export default function RecipeList({ onSelectRecipie, selectedRecipieId, isDraggable = false }: RecipeListProps) {
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
    <div className="h-full flex flex-col p-4 dark:bg-gray-800">
      <div className="sticky top-0 dark:bg-gray-800 pt-2 pb-3 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Lista Przepisów</h2>
          <button
            onClick={toggleFilters}
            className="md:hidden text-sm btn-secondary px-2 py-1"
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
                  ? 'btn-filter-active-green'
                  : 'btn-filter-inactive'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => handleDietFilterChange('vegetarian')}
              className={`btn-filter ${
                filterDiet === 'vegetarian'
                  ? 'btn-filter-active-green'
                  : 'btn-filter-inactive'
              }`}
            >
              Wegetariańskie
            </button>
            <button
              onClick={() => handleDietFilterChange('vegan')}
              className={`btn-filter ${
                filterDiet === 'vegan'
                  ? 'btn-filter-active-green'
                  : 'btn-filter-inactive'
              }`}
            >
              Wegańskie
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow dark:bg-gray-800">
        {filteredRecipies.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Brak przepisów spełniających kryteria</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredRecipies.map(recipie => {
              const isVegetarian = isRecipieVegetarian(recipie);
              const isVegan = isRecipieVegan(recipie);

              return (
                <RecipeListItem
                  key={recipie.id}
                  recipie={recipie}
                  isSelected={selectedRecipieId === recipie.id}
                  isVegetarian={isVegetarian}
                  isVegan={isVegan}
                  isDraggable={isDraggable}
                  onSelect={() => onSelectRecipie(recipie)}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
