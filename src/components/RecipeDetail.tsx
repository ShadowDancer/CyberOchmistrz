"use client";

import { Recipie } from '@/types';
import { getRecipieIngredients, isRecipieVegetarian, isRecipieVegan } from '@/lib/recipieData';
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

function Ingredient({ ingredient }: { 
  ingredient: { 
    name: string; 
    amount: number; 
    unit: string; 
    isVegan: boolean; 
    isVegetarian: boolean;
  } 
}) {  
  return (
    <div className="relative">
      <div className="flex justify-between items-center w-full"      >
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
  const isVegetarian = isRecipieVegetarian(dish);
  const isVegan = isRecipieVegan(dish);
  
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
          <DietaryBadge isVegetarian={isVegetarian} isVegan={isVegan} />
        </div>
      </div>
      
      <div className="my-6">
        <h3 className="text-lg font-medium mb-2">Poziom trudności</h3>
        <div className="flex items-center gap-2">
          <StarRating score={dish.difficulty} />
          <span className="text-gray-600">({dish.difficulty}/5)</span>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Opis</h3>
        <p className="text-gray-700">{dish.description}</p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Składniki</h3>
        {Object.entries(ingredientsByCategory).map(([category, ingredients]) => (
          <div key={category} className="mb-4">
            <h4 className="text-md font-medium my-2 text-gray-700 capitalize">{category}</h4>
            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="border-b border-gray-100 pb-2">
                  <Ingredient ingredient={ingredient} />
                </li>
              ))}
            </ul>
          </div>
        ))}
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