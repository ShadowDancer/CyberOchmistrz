'use client';

import { useState, useEffect } from 'react';
import { Cruise } from '../types';
import { getCruiseById } from '../lib/cruiseData';
import { useRouter } from 'next/navigation';
import CruiseSuppliesTab from './CruiseSuppliesTab';
import ShoppingListTab from './ShoppingListTab';
import CruisePlanTab from './CruisePlanTab';
import CruiseInfoTab from './CruiseInfoTab';

interface CruiseDetailProps {
  id: string;
}

export default function CruiseDetail({ id }: CruiseDetailProps) {
  const router = useRouter();
  const [cruise, setCruise] = useState<Cruise | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'supplies' | 'shopping'>('info');

  useEffect(() => {
    const cruiseData = getCruiseById(id);
    if (cruiseData) {
      // Initialize additionalSupplies array if it doesn't exist
      if (!cruiseData.additionalSupplies) {
        cruiseData.additionalSupplies = [];
      }
      setCruise(cruiseData);
    }
    setLoading(false);
  }, [id]);

  const handleCruiseChange = () => {
    // Refresh cruise data
    const updatedCruise = getCruiseById(id);
    if (updatedCruise) {
      setCruise(updatedCruise);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>;
  }

  if (!cruise) {
    return (
      <div className="text-center py-8">
        <p className="text-xl text-gray-700">Nie znaleziono rejsu</p>
        <button 
          onClick={() => router.push('/rejsy')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Wróć do listy rejsów
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">{cruise.name}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/rejsy')}
            className="text-gray-600 hover:text-gray-900"
          >
            Wróć
          </button>
        </div>
      </div>

      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'info' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Informacje
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'plan' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Plan posiłków
          </button>
          <button
            onClick={() => setActiveTab('supplies')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'supplies' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Dodatkowe zakupy
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'shopping' 
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Lista zakupów
          </button>
        </div>
      </div>

      {activeTab === 'info' && (
        <CruiseInfoTab cruise={cruise} />
      )}

      {activeTab === 'plan' && (
        <CruisePlanTab 
          cruise={cruise}
          onCruiseChange={handleCruiseChange}
        />
      )}

      {activeTab === 'supplies' && (
        <CruiseSuppliesTab
          cruise={cruise}
          onSupplyChange={handleCruiseChange}
        />
      )}

      {activeTab === 'shopping' && (
        <ShoppingListTab cruise={cruise} />
      )}
    </div>
  );
} 