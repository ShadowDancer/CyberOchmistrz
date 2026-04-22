'use client';

import { Cruise } from '../types';
import { deleteCruise } from '../model/cruiseData';
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
    <div className="content-padding">
      <div className="info-grid">
        <div className="info-card">
          <h2 className="info-card-title">Informacje podstawowe</h2>
          <div className="info-details">
            <div className="info-detail-row">
              <span className="info-detail-label">Utworzono:</span>
              <span>{formatDate(cruise.dateCreated)}</span>
            </div>
            <div className="info-detail-row">
              <span className="info-detail-label">Ostatnia modyfikacja:</span>
              <span>{formatDate(cruise.dateModified)}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h2 className="info-card-title">Parametry rejsu</h2>
          <div className="info-details">
            {cruise.startDate && (
              <div className="info-detail-row">
                <span className="info-detail-label">Data rozpoczęcia:</span>
                <span>{formatDate(cruise.startDate)}</span>
              </div>
            )}
            <div className="info-detail-row">
              <span className="info-detail-label">Długość rejsu:</span>
              <span>{cruise.length} dni</span>
            </div>
            <div className="info-detail-row">
              <span className="info-detail-label">Liczba załogantów:</span>
              <span>{cruise.crewMembers.length} osób</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-6 flex justify-end gap-3">
        <button
          onClick={() => router.push(`/rejsy/edytuj?id=${cruise.id}`)}
          className="btn-small btn-secondary"
        >
          Edytuj rejs
        </button>
        <button onClick={handleDelete} className="btn-small btn-remove">
          Usuń rejs
        </button>
      </div>
    </div>
  );
}
