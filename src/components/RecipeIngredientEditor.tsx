'use client';

import { useState } from 'react';
import { getIngredients } from '../model/supplyData';
import IngredientListEditor from './IngredientListEditor';
import { Recipie } from '@/model/recipe';

interface RecipeIngredientEditorProps {
  recipe: Recipie;
  dayNumber: number;
  recipeIndex: number;
  onSave: (
    dayNumber: number,
    recipeIndex: number,
    name: string,
    ingredients: Array<{ id: string; amount: number }>
  ) => void;
  onClose: () => void;
}

export default function RecipeIngredientEditor({
  recipe,
  dayNumber,
  recipeIndex,
  onSave,
  onClose
}: RecipeIngredientEditorProps) {
  const allIngredients = getIngredients();

  const [draftName, setDraftName] = useState(recipe.name);
  const [draftIngredients, setDraftIngredients] = useState<Array<{ id: string; amount: number }>>(
    () => recipe.ingredients.map(i => ({ ...i }))
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isDirty =
    draftName !== recipe.name ||
    JSON.stringify(draftIngredients) !== JSON.stringify(recipe.ingredients);

  const handleAmountChange = (index: number, amount: number) => {
    setDraftIngredients(prev => {
      const next = [...prev];
      next[index] = { ...next[index], amount };
      return next;
    });
  };

  const handleAdd = (id: string, amount: number) => {
    setDraftIngredients(prev => [...prev, { id, amount }]);
  };

  const handleRemove = (index: number) => {
    setDraftIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(dayNumber, recipeIndex, draftName, draftIngredients);
    onClose();
  };

  const handleCancelAttempt = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleCancelAttempt}
    >
      <div
        className="container-white rounded-lg p-4 w-full max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 gap-2">
          <h2 className="text-lg font-bold flex items-center gap-2 flex-1 min-w-0">
            <span className="whitespace-nowrap">Edytuj składniki -</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="text-lg font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 flex-1 min-w-0"
            />
          </h2>
          <button
            onClick={handleCancelAttempt}
            className="text-muted hover:text-muted-dark"
          >
            &times;
          </button>
        </div>

        <IngredientListEditor
          ingredients={draftIngredients}
          allIngredients={allIngredients}
          onIngredientAmountChange={handleAmountChange}
          onRemoveIngredient={handleRemove}
          onAddIngredient={handleAdd}
        />

        {showCancelConfirm && (
          <div className="mt-4 p-3 border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <p className="text-sm mb-3">Masz niezapisane zmiany. Czy chcesz je odrzucić?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="btn-secondary"
              >
                Wróć do edycji
              </button>
              <button
                onClick={onClose}
                className="btn-remove"
              >
                Odrzuć zmiany
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-600">
          <button
            onClick={handleCancelAttempt}
            className="btn-secondary"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
