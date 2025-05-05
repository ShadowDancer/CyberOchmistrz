"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Recipie } from '@/types';
import NewRecipeForm from '@/components/NewRecipeForm';
import { getRecipeById } from '@/lib/recipieData';

function EditRecipeForm(){
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const [recipe, setRecipe] = useState<Recipie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (recipeId) {
      const parsedId = parseInt(recipeId, 10);
      if (!isNaN(parsedId)) {
        const foundRecipe = getRecipeById(parsedId);
        setRecipe(foundRecipe || null);
      }
    }
    setIsLoading(false);
  }, [recipeId]);

  return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edytuj Przepis</h1>
          <Link
            href="/przepisy"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Powrót do przepisów
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <p>Ładowanie...</p>
          </div>
        ) : !recipe ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-500">Nie znaleziono przepisu o ID: {recipeId}</p>
            <Link
              href="/przepisy"
              className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Powrót do przepisów
            </Link>
          </div>
        ) : (
          <NewRecipeForm recipe={recipe} />
        )}
      </main>
  );
}

export default function EditRecipePage() {
  return (
    <Suspense>
      <EditRecipeForm />
    </Suspense>
  );
} 