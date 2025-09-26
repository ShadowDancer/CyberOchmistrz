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
          className="btn-secondary"
        >
          Powrót do przepisów
        </Link>
      </div>
      
      <NewRecipeForm />
    </main>
  );
}
