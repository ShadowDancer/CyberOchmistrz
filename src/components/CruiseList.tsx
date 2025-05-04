'use client';

import { useState, useEffect } from 'react';
import { Cruise } from '../types';
import { getCruises, deleteCruise } from '../lib/cruiseData';
import Link from 'next/link';

export default function CruiseList() {
  const [cruises, setCruises] = useState<Cruise[]>([]);

  useEffect(() => {
    setCruises(getCruises());
  }, []);

  const handleDelete = (id: string) => {
    deleteCruise(id);
    setCruises(getCruises());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rejsy</h1>
        <Link 
          href="/rejsy/dodaj" 
          className="rounded-full bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          Dodaj rejs
        </Link>
      </div>

      {cruises.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Brak zapisanych rejsów</p>
          <Link 
            href="/rejsy/dodaj" 
            className="text-blue-600 mt-2 inline-block hover:underline"
          >
            Dodaj pierwszy rejs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {cruises.map((cruise) => (
            <div 
              key={cruise.id} 
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">{cruise.name}</h2>
                <div className="flex gap-2">
                  <Link 
                    href={`/rejsy/${cruise.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Szczegóły
                  </Link>
                  <button 
                    onClick={() => handleDelete(cruise.id)}
                    className="text-red-600 hover:underline"
                  >
                    Usuń
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Utworzono:</span> {formatDate(cruise.dateCreated)}
                </div>
                <div>
                  <span className="font-medium">Zmodyfikowano:</span> {formatDate(cruise.dateModified)}
                </div>
                <div>
                  <span className="font-medium">Długość:</span> {cruise.length} dni
                </div>
                <div>
                  <span className="font-medium">Załoga:</span> {cruise.crew} osób
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 