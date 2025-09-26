"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Recipie } from '@/types';
import NewRecipeForm from '@/components/NewRecipeForm';
import { getRecipeById } from '@/model/recipieData';

function EditRecipeForm(){
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const [recipe, setRecipe] = useState<Recipie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (recipeId) {
      const foundRecipe = getRecipeById(recipeId);
      setRecipe(foundRecipe || null);
    }
    setIsLoading(false);
  }, [recipeId]);

  return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edytuj Przepis</h1>
          <Link
            href="/przepisy"
            className="btn-secondary"
          >
            Powrót do przepisów
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <p>Ładowanie...</p>
          </div>
        ) : !recipe ? (
          <div className="container-white-md p-6">
            <p className="error-text">Nie znaleziono przepisu o ID: {recipeId}</p>
            <Link
              href="/przepisy"
              className="mt-4 inline-block btn-primary"
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
