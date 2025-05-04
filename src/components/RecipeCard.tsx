"use client";

import { Recipie } from '@/types';
import { getRecipieIngredients } from '@/lib/recipieData';

interface RecipeCardProps {
  recipie: Recipie;
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

export default function RecipeCard({ recipie: recipie }: RecipeCardProps) {
  const recipieIngredients = getRecipieIngredients(recipie.ingredients);
  
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-semibold mb-2">{recipie.name}</h3>
          <p className="text-gray-500 text-sm">Typ posiłku: <span className="font-medium">{recipie.mealType.join(", ")}</span></p>
        </div>
        <div className="flex flex-col items-end text-xs text-gray-500 ml-2">
          <div className="flex items-center gap-1 mb-1">
            <span>Trudność:</span>
            <StarRating score={recipie.difficulty} />
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <h4 className="font-medium mb-1">Składniki:</h4>
        <ul className="list-disc list-inside text-sm">
          {recipieIngredients.map((ingredient, index) => (
            <li key={index}>
              {ingredient.name}: {ingredient.amount} {ingredient.unit}
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium mb-1">Opis:</h4>
        <p className="text-sm">{recipie.description}</p>
      </div>
      
      <div>
        <p className="text-xs text-gray-500">Typ: {recipie.mealType.join(', ')}</p>
      </div>
    </div>
  );
} 