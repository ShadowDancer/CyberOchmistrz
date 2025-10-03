'use client';

import AddSupplyForm from '@/components/AddSupplyForm';

export default function AddSupplyPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dodaj nowy produkt</h1>
      </div>

      <AddSupplyForm />
    </main>
  );
}
