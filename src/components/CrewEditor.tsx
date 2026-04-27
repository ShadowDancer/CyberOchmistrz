'use client';

import { CrewMember } from '../types';
import { Diet, DIET_REGISTRY } from '../model/crew';

interface CrewEditorProps {
  members: CrewMember[];
  onChange: (members: CrewMember[]) => void;
}

export default function CrewEditor({ members, onChange }: CrewEditorProps) {
  const updateMember = (index: number, updater: (m: CrewMember) => CrewMember) => {
    const next = members.map((m, i) => (i === index ? updater(m) : m));
    onChange(next);
  };

  const removeMember = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
  };

  const addMember = () => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `crew-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    onChange([...members, { id, name: 'Załogant #' + (members.length + 1), diet: 'omnivore' }]);
  };

  const handleNameChange = (index: number, name: string) => {
    updateMember(index, (m) => ({ ...m, name }));
  };

  const handleDietChange = (index: number, diet: Diet) => {
    updateMember(index, (m) => ({ ...m, diet }));
  };

  const vegCount = members.filter((m) => m.diet === 'vegetarian').length;
  const veganCount = members.filter((m) => m.diet === 'vegan').length;
  const omnivoreCount = members.filter((m) => m.diet === 'omnivore').length;

  return (
    <div className="border rounded-lg p-3 dark:border-gray-600">
      <div className="flex flex-col gap-2">
        {members.length === 0 && (
          <p className="text-sm text-muted-light italic">
            Bez załogi nigdzie nie popłyniemy. Zaciągnij kogoś za pomocą przycisku poniżej.
          </p>
        )}
        {members.map((member, index) => (
          <div
            key={member.id || index}
            className="flex flex-wrap items-center gap-2 p-2 border rounded dark:border-gray-700"
          >
            <input
              type="text"
              placeholder="Nazwa"
              value={member.name ?? ''}
              onChange={(e) => handleNameChange(index, e.target.value)}
              className="input-field flex-1 min-w-[140px]"
            />
            <select
              value={member.diet}
              onChange={(e) => handleDietChange(index, e.target.value as Diet)}
              className="input-field"
            >
              {(Object.keys(DIET_REGISTRY) as Diet[]).map((diet) => (
                <option key={diet} value={diet}>
                  {DIET_REGISTRY[diet].labelLong}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeMember(index)}
              className="btn-remove px-2 py-1 text-xs"
              aria-label="Usuń członka załogi"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {members.length > 0 &&
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{members.length} osób</span>
          {vegCount > 0 && (
            <span>· {vegCount} wegetarian</span>
          )}
          {veganCount > 0 && <span>· {veganCount} wegan</span>}
          {omnivoreCount > 0 && (
            <span>· {omnivoreCount} wszystkożernych</span>
          )}
        </div>
      }

      <button
        type="button"
        onClick={addMember}
        className="btn-primary btn-small mt-3"
      >
        + Zaokrętuj
      </button>
    </div>
  );
}
