'use client';

import { CrewMember } from '../types';
import { DIET_REGISTRY, DIET_TAGS, DietTagId } from '../model/dietTags';

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
    onChange([...members, { id, tags: [] }]);
  };

  const handleNameChange = (index: number, name: string) => {
    updateMember(index, (m) => {
      const next = { ...m };
      if (name.trim() === '') {
        delete next.name;
      } else {
        next.name = name;
      }
      return next;
    });
  };

  const toggleTag = (index: number, tagId: DietTagId) => {
    updateMember(index, (m) => {
      const tag = DIET_REGISTRY[tagId];
      const hasTag = m.tags.includes(tagId);
      let nextTags: string[];
      if (hasTag) {
        nextTags = m.tags.filter((t) => t !== tagId);
      } else {
        if (tag.exclusiveGroup) {
          nextTags = m.tags.filter((t) => {
            const existing = DIET_REGISTRY[t as DietTagId];
            return !existing || existing.exclusiveGroup !== tag.exclusiveGroup;
          });
        } else {
          nextTags = [...m.tags];
        }
        nextTags.push(tagId);
      }
      return { ...m, tags: nextTags };
    });
  };

  const vegCount = members.filter((m) => m.tags.includes('vegetarian')).length;
  const veganCount = members.filter((m) => m.tags.includes('vegan')).length;
  const omnivoreRemainder = members.length - vegCount - veganCount;

  const activeTagIds = new Set<DietTagId>(
    DIET_TAGS.filter((t) => members.some((m) => m.tags.includes(t))),
  );

  return (
    <div className="border rounded-lg p-3 dark:border-gray-600">
      <div className="flex flex-col gap-2">
        {members.length === 0 && (
          <p className="text-sm text-muted-light italic">
            Bez załogi nigdzie nie popłyniemy. Zaciągnij kogoś za pomocą przycisku poniżej.
          </p>
        )}
        {members.map((member, index) => {
          const unknownTags = member.tags.filter(
            (t) => !(t in DIET_REGISTRY),
          );
          return (
            <div
              key={member.id || index}
              className="flex flex-wrap items-center gap-2 p-2 border rounded dark:border-gray-700"
            >
              <input
                type="text"
                placeholder="Nazwa"
                value={member.name ?? 'Załogant #' + (index + 1)}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="input-field flex-1 min-w-[140px]"
              />
              <div className="flex flex-wrap gap-1">
                {DIET_TAGS.map((tagId) => {
                  const tag = DIET_REGISTRY[tagId];
                  const active = member.tags.includes(tagId);
                  return (
                    <button
                      key={tagId}
                      type="button"
                      onClick={() => toggleTag(index, tagId)}
                      className={`px-2 py-1 text-xs rounded border ${
                        active
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                      }`}
                      title={tag.labelPl}
                    >
                      {tag.shortPl}
                    </button>
                  );
                })}
                {unknownTags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 text-xs rounded border bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                    title="Nieznany znacznik"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="btn-remove px-2 py-1 text-xs"
                aria-label="Usuń członka załogi"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {members.length > 0 && 
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{members.length} osób</span>
          {activeTagIds.has('vegetarian') && (
            <span>· {vegCount} wegetarian</span>
          )}
          {activeTagIds.has('vegan') && <span>· {veganCount} wegan</span>}
          {omnivoreRemainder > 0 && (
            <span>· {omnivoreRemainder} wszystkożernych</span>
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
