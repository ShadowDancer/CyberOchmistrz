'use client';

import { useState, useEffect } from 'react';
import { Cruise } from '../types';
import { getCruises } from '../model/cruiseData';
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
    <div className="container-centered container-max-w-md">
      <div className="flex-between mb-4 md:mb-6">
        <h1 className="heading-primary">Rejsy</h1>
        <Link
          href="/rejsy/dodaj"
          className="btn-primary rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base"
        >
          Dodaj rejs
        </Link>
      </div>

      {cruises.length === 0 ? (
        <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg">
          <p className="text-muted">Brak zapisanych rejsów</p>
          <Link
            href="/rejsy/dodaj"
            className="text-blue-600 mt-2 inline-block hover:underline"
          >
            Dodaj pierwszy rejs
          </Link>
        </div>
      ) : (
        <div className="grid-responsive">
          {cruises.map((cruise) => (
            <div
              key={cruise.id}
              className="card card-padding"
              onClick={() => handleCruiseClick(cruise.id)}
            >
              <div className="flex justify-between">
                <h2 className="text-lg md:text-xl font-semibold">{cruise.name}</h2>
              </div>
              <div className="grid-cols-responsive gap-2 mt-2 text-xs md:text-sm text-muted">
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
