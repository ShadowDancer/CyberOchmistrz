'use client';

import { Recipie } from '../types';
import { getIngredients } from '../model/supplyData';
import IngredientListEditor from './IngredientListEditor';

interface RecipeIngredientEditorProps {
  recipe: Recipie;
  dayNumber: number;
  recipeIndex: number;
  onIngredientUpdate: (dayNumber: number, recipeIndex: number, ingredientIndex: number, newAmount: number) => void;
  onIngredientAdd: (dayNumber: number, recipeIndex: number, ingredientId: string, amount: number) => void;
  onIngredientRemove: (dayNumber: number, recipeIndex: number, ingredientIndex: number) => void;
  onClose: () => void;
}

export default function RecipeIngredientEditor({
  recipe,
  dayNumber,
  recipeIndex,
  onIngredientUpdate,
  onIngredientAdd,
  onIngredientRemove,
  onClose
}: RecipeIngredientEditorProps) {
  const allIngredients = getIngredients();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="container-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Edytuj składniki - {recipe.name}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-muted-dark"
          >
            &times;
          </button>
        </div>
        
        <IngredientListEditor
          ingredients={recipe.ingredients}
          allIngredients={allIngredients}
          onIngredientAmountChange={(index, amount) => onIngredientUpdate(dayNumber, recipeIndex, index, amount)}
          onRemoveIngredient={(index) => onIngredientRemove(dayNumber, recipeIndex, index)}
          onAddIngredient={(id, amount) => onIngredientAdd(dayNumber, recipeIndex, id, amount)}
        />

        <div className="flex justify-end mt-4 pt-4 border-t dark:border-gray-600">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
