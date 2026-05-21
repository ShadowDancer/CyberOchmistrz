'use client';

import { useState, useEffect, useRef } from 'react';
import { getCruises, saveCruise } from '../model/cruiseData';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { exportCruise, importCruiseFromFile } from '../utils/cruiseFileIO';
import { Cruise } from '@/model/cruise';

export default function CruiseList() {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCruises(getCruises());
  }, []);

  const handleExport = (e: React.MouseEvent, cruise: Cruise) => {
    e.stopPropagation();
    exportCruise(cruise);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const cruise = await importCruiseFromFile(file);
      const existing = getCruises().find(c => c.id === cruise.id);
      if (existing) {
        const confirmed = window.confirm('Rejs o tej nazwie już istnieje. Nadpisać?');
        if (!confirmed) return;
      }
      saveCruise(cruise);
      setCruises(getCruises());
    } catch (err) {
      window.alert(`Nieprawidłowy plik rejsu: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

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
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Link
            href="/rejsy/dodaj"
            className="btn-primary rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base"
          >
            Dodaj rejs
          </Link>
          <button
            onClick={handleImportClick}
            className="btn-secondary rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base"
          >
            Importuj z pliku
          </button>
        </div>
      </div>

      {cruises.length === 0 ? (
        <div className="text-center empty-state">
          <p className="text-muted">Brak zapisanych rejsów</p>
          <Link
            href="/rejsy/dodaj"
            className="text-link mt-2 inline-block hover:underline"
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
              <div className="flex justify-between items-start">
                <h2 className="text-lg md:text-xl font-semibold">{cruise.name}</h2>
                <button
                  onClick={(e) => handleExport(e, cruise)}
                  className="btn-secondary text-xs px-2 py-1 rounded ml-2 shrink-0"
                >
                  Eksportuj do pliku
                </button>
              </div>
              <div className="grid-cols-responsive gap-2 mt-2 text-xs md:text-sm text-muted">
                <div>
                  <span className="font-medium">Utworzono:</span> {formatDate(cruise.dateCreated)}
                </div>
                <div>
                  <span className="font-medium">Zmodyfikowano:</span> {formatDate(cruise.dateModified)}
                </div>
                {cruise.startDate && (
                  <div>
                    <span className="font-medium">Rozpoczęcie:</span> {formatDate(cruise.startDate)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Długość:</span> {cruise.length} dni
                </div>
                <div>
                  <span className="font-medium">Załoga:</span> {cruise.crewMembers.length} osób
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
