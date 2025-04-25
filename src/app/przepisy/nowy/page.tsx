"use client";

import Link from 'next/link';
import NewRecipeForm from '@/components/NewRecipeForm';

export default function NewRecipePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nowy Przepis</h1>
        <Link 
          href="/przepisy" 
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Powrót do przepisów
        </Link>
      </div>
      
      <NewRecipeForm />
    </main>
  );
} 