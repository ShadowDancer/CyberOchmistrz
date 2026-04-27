'use client';

import { useState } from 'react';
import { CrewMember } from '../model/crew';
import { Diet, DIET_REGISTRY } from '../model/crew';
import { getIngredients, getSupplyById } from '../model/supplyData';

interface CrewEditorProps {
  members: CrewMember[];
  onChange: (members: CrewMember[]) => void;
}

export default function CrewEditor({ members, onChange }: CrewEditorProps) {
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const toggleMember = (id: string) => {
    setExpandedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateMember = (index: number, updater: (m: CrewMember) => CrewMember) => {
    const next = members.map((m, i) => (i === index ? updater(m) : m));
    onChange(next);
  };

  const removeMember = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
  };

  const addMember = () => {
    const id = `crew-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    onChange([...members, { id, name: 'Załogant #' + (members.length + 1), diet: 'omnivore' }]);
    setExpandedMembers(prev => new Set(prev).add(id));
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
        {members.map((member, index) => {
          const key = member.id || String(index);
          const isExpanded = expandedMembers.has(key);
          return (
          <div
            key={key}
            className="flex flex-col gap-1 p-2 border rounded dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nazwa"
                value={member.name ?? ''}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="input-field flex-1 min-w-[140px]"
              />
              <button
                type="button"
                onClick={() => toggleMember(key)}
                className="px-2 py-1 text-xs text-muted hover:text-foreground"
                aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            </div>
            {isExpanded && (
              <>
                <div className="flex flex-wrap items-center gap-2 pl-1">
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
                </div>
                <MemberExclusionsEditor
                  member={member}
                  onExclusionsChange={(excludedSupplies) =>
                    updateMember(index, (m) => ({ ...m, excludedSupplies }))
                  }
                />
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => { if (window.confirm('Usunąć członka załogi?')) removeMember(index); }}
                    className="btn-remove px-2 py-1"
                    aria-label="Usuń członka załogi"
                  >
                    Usuń członka załogi
                  </button>
                </div>
              </>
            )}
          </div>
          );
        })}
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

interface MemberExclusionsEditorProps {
  member: CrewMember;
  onExclusionsChange: (excludedSupplies: string[] | undefined) => void;
}

function MemberExclusionsEditor({ member, onExclusionsChange }: MemberExclusionsEditorProps) {
  const [filter, setFilter] = useState('');
  const hasExclusions = member.excludedSupplies !== undefined;
  const excluded = member.excludedSupplies ?? [];
  const excludedSet = new Set(excluded);

  const filteredIngredients = getIngredients()
    .filter(ing => !excludedSet.has(ing.id))
    .filter(ing => filter === '' || ing.name.toLowerCase().includes(filter.toLowerCase()));

  const addExclusion = (id: string) => {
    if (!excludedSet.has(id)) {
      onExclusionsChange([...excluded, id]);
    }
  };

  const removeExclusion = (id: string) => {
    onExclusionsChange(excluded.filter(e => e !== id));
  };

  return (
    <div className="pl-1">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hasExclusions}
          onChange={(e) => onExclusionsChange(e.target.checked ? [] : undefined)}
        />
        Ma wykluczenia składników
      </label>
      {hasExclusions && (
        <div className="mt-1 flex flex-col gap-1">
          <input
            type="text"
            placeholder="Filtruj składniki..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field"
          />
          <div className="max-h-28 overflow-y-auto border rounded dark:border-gray-700">
            {filteredIngredients.map(ing => (
              <button
                key={ing.id}
                type="button"
                onClick={() => addExclusion(ing.id)}
                className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {ing.name}
              </button>
            ))}
            {filteredIngredients.length === 0 && (
              <div className="px-2 py-1 text-muted-light italic">Brak wyników</div>
            )}
          </div>
          {excluded.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {excluded.map(id => {
                const supply = getSupplyById(id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  >
                    {supply?.name ?? id}
                    <button
                      type="button"
                      onClick={() => removeExclusion(id)}
                      aria-label={`Usuń wykluczenie ${supply?.name ?? id}`}
                      className="hover:text-red-900 dark:hover:text-red-200 leading-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
