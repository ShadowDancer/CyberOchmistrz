"use client";

import React, { useState } from 'react';
import { Recipie, MealType, IngredientAmount } from '@/types';
import { getIngredients } from '@/lib/recipieData';

export default function NewRecipeForm() {
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([MealType.DINNER]);
  const [difficulty, setDifficulty] = useState(1);
  const [ingredients, setIngredients] = useState<Array<{ id: string; amount: number }>>([{ id: '', amount: 0 }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [jsonOutput, setJsonOutput] = useState('');

  const allIngredients = getIngredients();

  const toggleMealType = (type: MealType) => {
    if (selectedMealTypes.includes(type)) {
      setSelectedMealTypes(selectedMealTypes.filter(t => t !== type));
    } else {
      setSelectedMealTypes([...selectedMealTypes, type]);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: '', amount: 0 }]);
  };

  const updateIngredientId = (index: number, value: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index].id = value;
    setIngredients(updatedIngredients);
  };

  const updateIngredientAmount = (index: number, value: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index].amount = Number(value);
    setIngredients(updatedIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const updatedIngredients = [...ingredients];
      updatedIngredients.splice(index, 1);
      setIngredients(updatedIngredients);
    }
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...instructions];
    updatedInstructions[index] = value;
    setInstructions(updatedInstructions);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      const updatedInstructions = [...instructions];
      updatedInstructions.splice(index, 1);
      setInstructions(updatedInstructions);
    }
  };

  const generateJson = () => {
    // Filter out empty values
    const filteredIngredients = ingredients
      .filter(ing => ing.id.trim() !== '' && ing.amount > 0)
      .map(ing => ({ 
        id: ing.id.trim(), 
        amount: ing.amount 
      }));

    const filteredInstructions = instructions
      .filter(inst => inst.trim() !== '')
      .map(inst => inst.trim());

    // Ensure at least one meal type is selected
    const mealTypes = selectedMealTypes.length > 0 
      ? selectedMealTypes 
      : [MealType.DINNER];

    const recipie: Recipie = {
      id: Date.now(), // temporary ID as number
      name: recipeName.trim(),
      description: description.trim(),
      mealType: mealTypes,
      difficulty: difficulty,
      ingredients: filteredIngredients as IngredientAmount[],
      instructions: filteredInstructions
    };

    const jsonString = JSON.stringify(recipie, null, 2);
    setJsonOutput(jsonString);
    return recipie;
  };

  const copyToClipboard = () => {
    generateJson();
    navigator.clipboard.writeText(jsonOutput);
    alert('Recipe JSON copied to clipboard!');
  };

  const downloadJson = () => {
    const dish = generateJson();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dish, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${recipeName.trim() || 'new-recipe'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-6">
        {/* Basic Info Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Informacje podstawowe</h2>
          <div>
            <label className="block mb-1">Nazwa przepisu</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div className="mt-4">
            <label className="block mb-1">Rodzaj posiłku (wybierz jeden lub więcej)</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(MealType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleMealType(type)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedMealTypes.includes(type) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block mb-1">Opis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
        </div>

        {/* Ratings Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Oceny</h2>
          <div>
            <label className="block mb-1">Trudność (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Składniki</h2>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="mb-2 flex items-end gap-2">
              <div className="w-3/5">
                <label className="block text-sm mb-1">Składnik</label>
                <select
                  value={ingredient.id}
                  onChange={(e) => updateIngredientId(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Wybierz składnik</option>
                  {allIngredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-1/4">
                <label className="block text-sm mb-1">Ilość</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={ingredient.amount}
                  onChange={(e) => updateIngredientAmount(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                {index === ingredients.length - 1 && (
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="px-3 py-2 bg-green-500 text-white rounded"
                  >
                    +
                  </button>
                )}
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Instrukcje</h2>
          {instructions.map((instruction, index) => (
            <div key={index} className="mb-2 flex items-start gap-2">
              <div className="w-4/5">
                <label className="block text-sm mb-1">Krok {index + 1}</label>
                <textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 mt-6">
                {index === instructions.length - 1 && (
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="px-3 py-2 bg-green-500 text-white rounded"
                  >
                    +
                  </button>
                )}
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={generateJson}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Wygeneruj JSON
          </button>
          <button
            type="button"
            onClick={copyToClipboard}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Kopiuj do schowka
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Pobierz jako JSON
          </button>
        </div>

        {/* JSON Output */}
        {jsonOutput && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">JSON Output</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {jsonOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 