'use client';

import { useState, useEffect } from 'react';
import { Recipie } from '../types';
import { getRecipieIngredients } from '../model/recipieData';
import { getIngredients } from '../model/supplyData';

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
  // Get full ingredient details from the recipe
  const enrichedIngredients = getRecipieIngredients(recipe.ingredients);
  const [ingredients, setIngredients] = useState(enrichedIngredients);
  const [newIngredient, setNewIngredient] = useState<{ id: string, amount: number }>({ id: '', amount: 0 });
  const allIngredients = getIngredients();

  // Refresh ingredients whenever recipe changes
  useEffect(() => {
    setIngredients(getRecipieIngredients(recipe.ingredients));
  }, [recipe.ingredients]);

  const handleAmountChange = (index: number, value: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      amount: Number(value)
    };
    setIngredients(updatedIngredients);
  };

  const handleSaveAmount = (index: number) => {
    onIngredientUpdate(dayNumber, recipeIndex, index, ingredients[index].amount);
  };

  const handleRemoveIngredient = (index: number) => {
    onIngredientRemove(dayNumber, recipeIndex, index);
  };

  const handleAddNewIngredient = () => {
    if (newIngredient.id && newIngredient.amount > 0) {
      onIngredientAdd(dayNumber, recipeIndex, newIngredient.id, newIngredient.amount);
      setNewIngredient({ id: '', amount: 0 });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Edytuj składniki - {recipe.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Obecne składniki</h3>
          {ingredients.length === 0 ? (
            <p className="text-gray-500 italic">Brak składników</p>
          ) : (
            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="border rounded p-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{ingredient.name}</span>
                    <button 
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-red-600 text-sm"
                    >
                      Usuń
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ingredient.amount}
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      className="w-20 px-2 py-1 border rounded"
                    />
                    <span>{ingredient.unit}</span>
                    <button
                      onClick={() => handleSaveAmount(index)}
                      className="ml-auto text-sm bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Zapisz
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Dodaj nowy składnik</h3>
          <div className="flex flex-col gap-2">
            <select
              value={newIngredient.id}
              onChange={(e) => setNewIngredient({ ...newIngredient, id: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Wybierz składnik</option>
              {allIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={newIngredient.amount}
                onChange={(e) => setNewIngredient({ ...newIngredient, amount: Number(e.target.value) })}
                className="w-20 px-2 py-1 border rounded"
                placeholder="Ilość"
              />
              <span>
                {newIngredient.id ? 
                  allIngredients.find(ing => ing.id === newIngredient.id)?.unit || '' : 
                  ''
                }
              </span>
            </div>
            <button
              onClick={handleAddNewIngredient}
              disabled={!newIngredient.id || newIngredient.amount <= 0}
              className={`px-3 py-2 rounded text-white ${
                !newIngredient.id || newIngredient.amount <= 0 ? 
                'bg-gray-400 cursor-not-allowed' : 
                'bg-green-600 hover:bg-green-700'
              }`}
            >
              Dodaj składnik
            </button>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
} 