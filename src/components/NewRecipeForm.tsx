"use client";

import React, { useState, useEffect } from 'react';
import { Recipie, Ingredient, MealType, IngredientAmount } from '@/types';
import { getIngredients, getRecipies } from '@/lib/recipieData';

export default function NewRecipeForm() {
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([MealType.DINNER]);
  const [difficulty, setDifficulty] = useState(1);
  const [tasteScore, setTasteScore] = useState(1);
  const [preparationTime, setPreparationTime] = useState(0);
  const [ingredients, setIngredients] = useState<Array<{ id: string; amount: number }>>([{ id: '', amount: 0 }]);
  const [equipment, setEquipment] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [jsonOutput, setJsonOutput] = useState('');
  const [allUniqueEquipment, setAllUniqueEquipment] = useState<string[]>([]);

  const allIngredients = getIngredients();

  useEffect(() => {
    // Extract all unique equipment items from existing dishes
    const dishes = getRecipies();
    const equipmentSet = new Set<string>();
    
    dishes.forEach(dish => {
      dish.equipment.forEach(item => {
        equipmentSet.add(item);
      });
    });
    
    setAllUniqueEquipment(Array.from(equipmentSet));
  }, []);

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

  const addEquipment = () => {
    setEquipment([...equipment, '']);
  };

  const updateEquipment = (index: number, value: string) => {
    const updatedEquipment = [...equipment];
    updatedEquipment[index] = value;
    setEquipment(updatedEquipment);
  };

  const removeEquipment = (index: number) => {
    if (equipment.length > 1) {
      const updatedEquipment = [...equipment];
      updatedEquipment.splice(index, 1);
      setEquipment(updatedEquipment);
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

    const filteredEquipment = equipment
      .filter(eq => eq.trim() !== '')
      .map(eq => eq.trim());

    const filteredInstructions = instructions
      .filter(inst => inst.trim() !== '')
      .map(inst => inst.trim());

    // Ensure at least one meal type is selected
    const mealTypes = selectedMealTypes.length > 0 
      ? selectedMealTypes 
      : [MealType.DINNER];

    const dish: Recipie = {
      id: Date.now(), // temporary ID as number
      name: recipeName.trim(),
      description: description.trim(),
      mealType: mealTypes,
      difficulty: difficulty,
      tasteScore: tasteScore,
      preparationTime: preparationTime,
      ingredients: filteredIngredients as IngredientAmount[],
      equipment: filteredEquipment,
      instructions: filteredInstructions
    };

    const jsonString = JSON.stringify(dish, null, 2);
    setJsonOutput(jsonString);
    return dish;
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block mb-1">Ocena smaku (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={tasteScore}
                onChange={(e) => setTasteScore(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Czas przygotowania (min)</label>
              <input
                type="number"
                min="0"
                value={preparationTime}
                onChange={(e) => setPreparationTime(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Składniki</h2>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="flex-grow">
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
              <div className="flex-grow">
                <input
                  type="number"
                  placeholder="Ilość"
                  min="0"
                  step="0.1"
                  value={ingredient.amount}
                  onChange={(e) => updateIngredientAmount(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                disabled={ingredients.length <= 1}
              >
                Usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Dodaj składnik
          </button>
        </div>

        {/* Equipment Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Wyposażenie</h2>
          {equipment.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="flex-grow">
                <input
                  type="text"
                  list="equipment-list"
                  placeholder="Nazwa wyposażenia"
                  value={item}
                  onChange={(e) => updateEquipment(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <datalist id="equipment-list">
                  {allUniqueEquipment.map((equip) => (
                    <option key={equip} value={equip} />
                  ))}
                </datalist>
              </div>
              <button
                type="button"
                onClick={() => removeEquipment(index)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                disabled={equipment.length <= 1}
              >
                Usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEquipment}
            className="mt-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Dodaj wyposażenie
          </button>
        </div>

        {/* Instructions Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Instrukcje</h2>
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="flex-grow">
                <textarea
                  placeholder={`Krok ${index + 1}`}
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 h-10"
                disabled={instructions.length <= 1}
              >
                Usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addInstruction}
            className="mt-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Dodaj instrukcję
          </button>
        </div>

        {/* Output Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Wygeneruj JSON</h2>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={generateJson}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generuj JSON
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Kopiuj do schowka
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Pobierz JSON
            </button>
          </div>
          {jsonOutput && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {jsonOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 