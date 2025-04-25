"use client";

import { Recipie } from '@/types';
import { getRecipieIngredients, isDishVegetarian, isDishVegan } from '@/lib/recipieData';
import { Clock } from 'lucide-react';
import { useState } from 'react';

interface RecipeDetailProps {
  dish: Recipie | null;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-xl ${star <= score ? 'text-yellow-400' : 'text-gray-300'}`}>
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

function formatFreshness(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} rok${years > 1 ? (years < 5 ? 'i' : 'ów') : ''}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} miesiąc${months > 1 ? (months < 5 ? 'e' : 'y') : ''}`;
  }
  return `${days} dni`;
}

function getStorageLabel(type: string): string {
  const storageLabels: Record<string, string> = {
    room: "Przechowuj w spiżarni",
    fridge: "Przechowuj w lodówce",
    freezer: "Przechowuj w zamrażarce"
  };
  
  return storageLabels[type] || type;
}

function DietaryBadge({ isVegetarian, isVegan }: { isVegetarian: boolean; isVegan: boolean }) {
  if (isVegan) {
    return (
      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
        Wegańskie
      </span>
    );
  }
  
  if (isVegetarian) {
    return (
      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
        Wegetariańskie
      </span>
    );
  }
  
  return null;
}

function IngredientWithTooltip({ ingredient }: { 
  ingredient: { 
    name: string; 
    amount: number; 
    unit: string; 
    isVegan: boolean; 
    isVegetarian: boolean;
    freshnessDays: number;
    storageType: string;
  } 
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative">
      <div 
        className="flex justify-between items-center w-full"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center">
          <span>{ingredient.name}</span>
          {ingredient.isVegan && (
            <span className="ml-2 px-1 text-xs text-green-800 bg-green-100 rounded">V</span>
          )}
          {!ingredient.isVegan && ingredient.isVegetarian && (
            <span className="ml-2 px-1 text-xs text-green-700 bg-green-50 rounded">Veg</span>
          )}
        </div>
        <span className="text-gray-600">{ingredient.amount} {ingredient.unit}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute z-10 p-2 bg-white rounded shadow-lg border border-gray-200 text-xs w-auto min-w-48 -mt-1 right-0">
          <div className="mb-1">
            <span className="font-medium">Przechowywanie: </span>
            <span className={`
              ${ingredient.storageType === 'room' ? 'text-gray-800' : ''}
              ${ingredient.storageType === 'fridge' ? 'text-blue-700' : ''}
              ${ingredient.storageType === 'freezer' ? 'text-indigo-700' : ''}
            `}>
              {getStorageLabel(ingredient.storageType)}
            </span>
          </div>
          <div>
            <span className="font-medium">Świeżość: </span>
            <span className={`
              ${ingredient.freshnessDays <= 3 ? 'text-red-700' : ''}
              ${ingredient.freshnessDays > 3 && ingredient.freshnessDays <= 7 ? 'text-yellow-700' : ''}
              ${ingredient.freshnessDays > 7 && ingredient.freshnessDays <= 30 ? 'text-green-700' : ''}
              ${ingredient.freshnessDays > 30 ? 'text-gray-700' : ''}
            `}>
              {formatFreshness(ingredient.freshnessDays)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecipeDetail({ dish }: RecipeDetailProps) {
  if (!dish) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Wybierz przepis z listy, aby zobaczyć szczegóły</p>
      </div>
    );
  }

  const dishIngredients = getRecipieIngredients(dish.ingredients);
  const isVegetarian = isDishVegetarian(dish);
  const isVegan = isDishVegan(dish);
  
  // Group ingredients by category
  const ingredientsByCategory = dishIngredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, typeof dishIngredients>);
  
  return (
    <div className="h-full overflow-y-auto p-4 scroll-smooth">
      <div className="sticky top-0 bg-white pt-2 pb-3 z-10">
        <h2 className="text-2xl font-bold">{dish.name}</h2>
        
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {dish.mealType}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            {formatTime(dish.preparationTime)}
          </span>
          <DietaryBadge isVegetarian={isVegetarian} isVegan={isVegan} />
        </div>
      </div>
      
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Poziom trudności</h3>
          <div className="flex items-center gap-2">
            <StarRating score={dish.difficulty} />
            <span className="text-gray-600">({dish.difficulty}/5)</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Ocena smaku</h3>
          <div className="flex items-center gap-2">
            <StarRating score={dish.tasteScore} />
            <span className="text-gray-600">({dish.tasteScore}/5)</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Czas przygotowania</h3>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-5 h-5 text-green-600" />
          <span>{formatTime(dish.preparationTime)}</span>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Opis</h3>
        <p className="text-gray-700">{dish.description}</p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Składniki</h3>
        <p className="text-xs text-gray-500 italic mb-2">Najedź kursorem na składnik, aby zobaczyć więcej informacji</p>
        {Object.entries(ingredientsByCategory).map(([category, ingredients]) => (
          <div key={category} className="mb-4">
            <h4 className="text-md font-medium my-2 text-gray-700 capitalize">{category}</h4>
            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="border-b border-gray-100 pb-2">
                  <IngredientWithTooltip ingredient={ingredient} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Wyposażenie</h3>
        <ul className="list-disc list-inside">
          {dish.equipment.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      
      {dish.instructions && dish.instructions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Sposób przygotowania</h3>
          <ol className="list-decimal list-outside ml-5 space-y-2">
            {dish.instructions.map((instruction, index) => (
              <li key={index} className="text-gray-700 pl-2 pb-2">
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
} 