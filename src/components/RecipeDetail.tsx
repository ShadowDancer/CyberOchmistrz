"use client";

import { Recipie } from '@/types';
import { getRecipieIngredients, isRecipieVegetarian, isRecipieVegan } from '@/lib/recipieData';
import Link from 'next/link';

interface RecipeDetailProps {
  dish: Recipie | null;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-md md:text-xl ${star <= score ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function DietaryBadge({ isVegetarian, isVegan }: { isVegetarian: boolean; isVegan: boolean }) {
  if (isVegan) {
    return (
      <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-green-100 text-green-800 rounded-full text-xs md:text-sm">
        Wegańskie
      </span>
    );
  }
  
  if (isVegetarian) {
    return (
      <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm">
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
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center">
          <span>{ingredient.name}</span>
          {ingredient.isVegan && (
            <span className="ml-2 px-1 text-xs text-green-800 bg-green-100 rounded">V</span>
          )}
          {!ingredient.isVegan && ingredient.isVegetarian && (
            <span className="ml-2 px-1 text-xs text-green-700 bg-green-50 rounded">Veg</span>
          )}
        </div>
        <span className="text-gray-600 text-sm">{ingredient.amount} {ingredient.unit}</span>
      </div>
    </div>
  );
}

export default function RecipeDetail({ dish: recipie }: RecipeDetailProps) {
  if (!recipie) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Wybierz przepis z listy, aby zobaczyć szczegóły</p>
      </div>
    );
  }

  const recipieIngredients = getRecipieIngredients(recipie.ingredients);
  const isVegetarian = isRecipieVegetarian(recipie);
  const isVegan = isRecipieVegan(recipie);
  
  // Group ingredients by category
  const ingredientsByCategory = recipieIngredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, typeof recipieIngredients>);
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="sticky top-0 bg-white p-3 z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
          <h2 className="text-xl md:text-2xl font-bold">{recipie.name}</h2>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <DietaryBadge isVegetarian={isVegetarian} isVegan={isVegan} />
            <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm">
              {recipie.mealType}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm">Trudność:</span> 
              <StarRating score={recipie.difficulty} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow p-3 md:p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm md:text-base text-gray-700">{recipie.description}</p>
          <Link
            href={`/przepisy/edytuj?id=${recipie.id}`}
            className="flex-shrink-0 ml-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Edytuj
          </Link>
        </div>
        
        <div className="mb-5 md:mb-6">
          <h3 className="text-md md:text-lg font-medium mb-2">Składniki</h3>
          {Object.entries(ingredientsByCategory).map(([category, ingredients]) => (
            <div key={category} className="mb-3 md:mb-4">
              <h4 className="text-sm md:text-md font-medium my-2 text-gray-700 capitalize">{category}</h4>
              <ul className="space-y-1 md:space-y-2">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="border-b border-gray-100 pb-1 md:pb-2 text-sm md:text-base">
                    <Ingredient ingredient={ingredient} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {recipie.instructions && recipie.instructions.length > 0 && (
          <div className="mb-5 md:mb-6">
            <h3 className="text-md md:text-lg font-medium mb-2">Sposób przygotowania</h3>
            <ol className="list-decimal list-outside ml-4 md:ml-5 space-y-1 md:space-y-2">
              {recipie.instructions.map((instruction, index) => (
                <li key={index} className="text-sm md:text-base text-gray-700 pl-1 md:pl-2 pb-1 md:pb-2">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}
        
        {/* Author Information */}
        {recipie.developedBy && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 italic flex items-center">
              <span className="font-medium mr-2">Opracował/a:</span> 
              {recipie.developedBy}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 