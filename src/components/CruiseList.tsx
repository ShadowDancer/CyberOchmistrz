'use client';

import { useState, useEffect } from 'react';
import { Cruise } from '../types';
import { getCruises } from '../lib/cruiseData';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CruiseList() {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const router = useRouter();

  useEffect(() => {
    setCruises(getCruises());
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCruiseClick = (id: string) => {
    router.push(`/rejsy?id=${id}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Rejsy</h1>
        <Link 
          href="/rejsy/dodaj" 
          className="rounded-full bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base hover:bg-blue-700 transition-colors"
        >
          Dodaj rejs
        </Link>
      </div>

      {cruises.length === 0 ? (
        <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Brak zapisanych rejsów</p>
          <Link 
            href="/rejsy/dodaj" 
            className="text-blue-600 mt-2 inline-block hover:underline"
          >
            Dodaj pierwszy rejs
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {cruises.map((cruise) => (
            <div 
              key={cruise.id} 
              className="border rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCruiseClick(cruise.id)}
            >
              <div className="flex justify-between">
                <h2 className="text-lg md:text-xl font-semibold">{cruise.name}</h2>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs md:text-sm text-gray-600">
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