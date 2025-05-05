'use client';

import { Cruise } from '../types';
import { deleteCruise } from '../lib/cruiseData';
import { useRouter } from 'next/navigation';

interface CruiseInfoTabProps {
  cruise: Cruise;
}

export default function CruiseInfoTab({ cruise }: CruiseInfoTabProps) {
  const router = useRouter();

  const handleDelete = () => {
    if (confirm('Czy na pewno chcesz usunąć ten rejs?')) {
      deleteCruise(cruise.id);
      router.push('/rejsy');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-3 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
          <h2 className="text-base md:text-lg font-medium mb-2">Informacje podstawowe</h2>
          <div className="grid gap-2 text-sm md:text-base">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Utworzono:</span>
              <span>{formatDate(cruise.dateCreated)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ostatnia modyfikacja:</span>
              <span>{formatDate(cruise.dateModified)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
          <h2 className="text-base md:text-lg font-medium mb-2">Parametry rejsu</h2>
          <div className="grid gap-2 text-sm md:text-base">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Długość rejsu:</span>
              <span>{cruise.length} dni</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Liczba załogantów:</span>
              <span>{cruise.crew} osób</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 md:mt-6 flex justify-end">
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-md text-sm md:text-base hover:bg-red-700 transition-colors"
        >
          Usuń rejs
        </button>
      </div>
    </div>
  );
} 