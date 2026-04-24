'use client';

import { useState } from 'react';
import { Cruise, CrewMember } from '../types';
import { deleteCruise } from '../model/cruiseData';
import { useRouter } from 'next/navigation';
import { DIET_REGISTRY, DietTagId } from '../model/dietTags';

interface CruiseInfoTabProps {
  cruise: Cruise;
}

export default function CruiseInfoTab({ cruise }: CruiseInfoTabProps) {
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);

  const handleDelete = () => {
    if (confirm('Czy na pewno chcesz usunąć ten rejs?')) {
      deleteCruise(cruise.id);
      router.push('/rejsy');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const vegCount = cruise.crewMembers.filter((m) => m.tags.includes('vegetarian')).length;
  const veganCount = cruise.crewMembers.filter((m) => m.tags.includes('vegan')).length;
  const omnivoreRemainder = cruise.crewMembers.length - vegCount - veganCount;

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
              <span className="info-detail-label">Załoga:</span>
              <span>{cruise.crewMembers.length} osób</span>
            </div>
            <div className="info-detail-row">
              <span className="info-detail-label"></span>
              <div className="flex flex-col gap-1">
                {omnivoreRemainder > 0 && (
                  <span className="text-sm">• {omnivoreRemainder} wszystkożernych</span>
                )}
                {vegCount > 0 && (
                  <span className="text-sm">• {vegCount} wegetarian</span>
                )}
                {veganCount > 0 && (
                  <span className="text-sm">• {veganCount} wegan</span>
                )}
                {cruise.crewMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMembers((s) => !s)}
                    className="text-link text-sm text-left mt-1"
                  >
                    {showMembers
                      ? 'Ukryj członków załogi ▲'
                      : 'Pokaż członków załogi ▼'}
                  </button>
                )}
                {showMembers && (
                  <ul className="mt-1 pl-2 space-y-0.5">
                    {cruise.crewMembers.map((m, i) => (
                      <li key={m.id || i} className="text-sm text-muted">
                        {describeMember(m)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

function describeMember(member: CrewMember): string {
  const name = member.name?.trim() ? member.name : '(anonimowy)';
  const knownTags = member.tags
    .map((t) => DIET_REGISTRY[t as DietTagId])
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .map((t) => t.labelPl);
  const unknownTags = member.tags.filter((t) => !(t in DIET_REGISTRY));
  const labels = [...knownTags, ...unknownTags];
  if (labels.length === 0) return `${name} — brak diety`;
  return `${name} — ${labels.join(', ')}`;
}
