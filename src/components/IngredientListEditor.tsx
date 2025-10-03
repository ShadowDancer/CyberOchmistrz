'use client';

import { useState, useEffect, useRef } from 'react';
import { Supply } from '../types';
import IngredientAmountEditor from './IngredientAmountEditor';

interface IngredientListEditorProps {
  ingredients: Array<{ id: string; amount: number }>;
  allIngredients: Supply[];
  onIngredientAmountChange: (index: number, amount: number) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: (id: string, amount: number) => void;
}

export default function IngredientListEditor({
  ingredients,
  allIngredients,
  onIngredientAmountChange,
  onRemoveIngredient,
  onAddIngredient
}: IngredientListEditorProps) {
  const [newIngredientSearch, setNewIngredientSearch] = useState('');
  const [showCombobox, setShowCombobox] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const filteredIngredients = allIngredients.filter(ing =>
    ing.name.toLowerCase().includes(newIngredientSearch.toLowerCase()) ||
    ing.id.toLowerCase().includes(newIngredientSearch.toLowerCase())
  );

  const handleAddIngredient = (ingredientId: string) => {
    const ingredient = allIngredients.find(ing => ing.id === ingredientId);
    if (ingredient) {
      onAddIngredient(ingredientId, ingredient.isIngredient ? 0 : 1);
      setNewIngredientSearch('');
      setShowCombobox(false);
    }
  };

  // Handle clicks outside the combobox to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setShowCombobox(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCombobox(false);
      }
    };

    if (showCombobox) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCombobox]);

  // Close dropdown when search is cleared
  useEffect(() => {
    if (!newIngredientSearch.trim()) {
      setShowCombobox(false);
    }
  }, [newIngredientSearch]);

  return (
    <div>
      <h2 className="heading-secondary">Składniki</h2>
      {ingredients.map((ingredient, index) => {
        const selectedIngredient = allIngredients.find(ing => ing.id === ingredient.id);
        return (
          <div key={index} className="mb-2 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="w-3/5">
                <label className="form-label">Składnik</label>
                <div className="input-simple bg-gray-50 dark:bg-gray-800 flex items-center px-3 py-2">
                  <span className="text-sm">
                    {selectedIngredient ? `${selectedIngredient.name} (${selectedIngredient.unit})` : 'Wybierz składnik'}
                  </span>
                </div>
              </div>
              <div className="w-1/4">
                <label className="form-label">Ilość</label>
                {selectedIngredient ? (
                  <IngredientAmountEditor
                    value={ingredient.amount}
                    onChange={(value) => onIngredientAmountChange(index, value)}
                    supply={selectedIngredient}
                  />
                ) : (
                  <div className="text-muted-light italic">Wybierz składnik</div>
                )}
              </div>
              <div className="flex gap-2 self-end">
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveIngredient(index)}
                    className="btn-small btn-remove"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
            {selectedIngredient?.description && (
              <div className="pl-1">
                <p className="text-xs text-muted-light italic">
                  {selectedIngredient.description}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new ingredient combobox */}
      <div className="mt-2" ref={comboboxRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Dodaj składnik..."
            value={newIngredientSearch}
            onChange={(e) => {
              setNewIngredientSearch(e.target.value);
              setShowCombobox(true);
            }}
            onFocus={() => setShowCombobox(true)}
            className="input-simple"
          />
          {showCombobox && filteredIngredients.length > 0 && (
            <div className="dropdown-container">
              {filteredIngredients.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => handleAddIngredient(ing.id)}
                  className="w-full text-left list-item-interactive"
                >
                  <span className="text-sm">
                    {ing.name} ({ing.unit})
                  </span>
                  {ing.description && (
                    <span className="text-xs text-muted-light block">
                      {ing.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
