'use client';

import { useState } from 'react';
import { getCruiseById } from '../model/cruiseData';
import { useRouter } from 'next/navigation';
import CruiseSuppliesTab from './CruiseSuppliesTab';
import ShoppingListTab from './ShoppingListTab';
import CruiseMenuTab from './CruiseMenuTab';
import CruiseInfoTab from './CruiseInfoTab';
import { useCruise } from '@/app/rejsy/CruiseProvider';

export default function CruiseDetail() {
  const router = useRouter();
  const { cruise, setCruise } = useCruise();
  const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'supplies' | 'shopping'>('info');

  const handleCruiseChange = () => {
    // Refresh cruise data
    const updatedCruise = getCruiseById(id);
    if (updatedCruise) {
      setCruise(updatedCruise);
    }
  };

  if (!cruise) {
    return (
      <div className="empty-state">
        <p className="text-xl text-muted-dark">Nie znaleziono rejsu</p>
        <button
          onClick={() => router.push('/rejsy')}
          className="empty-state-link"
        >
          Wróć do listy rejsów
        </button>
      </div>
    );
  }

  return (
    <div className="container-centered container-max-w-lg container-white flex flex-col h-full">
      <div className="flex-between p-3 md:p-6 border-b">
        <h1 className="heading-primary truncate">{cruise.name}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/rejsy')}
            className="text-muted hover:text-gray-900"
          >
            Wróć
          </button>
        </div>
      </div>

      <div className="tab-container">
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('info')}
            className={`btn-tab ${
              activeTab === 'info'
                ? 'btn-tab-active'
                : 'btn-tab-inactive'
            }`}
          >
            Informacje
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`btn-tab ${
              activeTab === 'plan'
                ? 'btn-tab-active'
                : 'btn-tab-inactive'
            }`}
          >
            Plan posiłków
          </button>
          <button
            onClick={() => setActiveTab('supplies')}
            className={`btn-tab ${
              activeTab === 'supplies'
                ? 'btn-tab-active'
                : 'btn-tab-inactive'
            }`}
          >
            Dodatkowe zakupy
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`btn-tab ${
              activeTab === 'shopping'
                ? 'btn-tab-active'
                : 'btn-tab-inactive'
            }`}
          >
            Lista zakupów
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {activeTab === 'info' && (
          <CruiseInfoTab cruise={cruise} />
        )}

        {activeTab === 'plan' && (
          <CruiseMenuTab
            cruise={cruise}
            onCruiseChange={setCruise}
          />
        )}

        {activeTab === 'supplies' && (
          <CruiseSuppliesTab
            cruise={cruise}
            onSupplyChange={setCruise}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListTab cruise={cruise} />
        )}
      </div>
    </div>
  );
}
