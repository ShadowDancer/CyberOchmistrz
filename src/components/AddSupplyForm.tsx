'use client';

import React, { useState } from 'react';
import { Supply, Ingredient, SupplyValidationErrors } from '@/types';
import { validateNewSupply, isSupplyDataValid } from '@/model/supplyData';

export default function AddSupplyForm() {
  const [isIngredient, setIsIngredient] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [defaultAmount, setDefaultAmount] = useState<string>('');
  const [isVegetarian, setIsVegetarian] = useState<boolean>(false);
  const [isVegan, setIsVegan] = useState<boolean>(false);
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [errors, setErrors] = useState<SupplyValidationErrors>({
    name: '',
    unit: '',
    category: '',
    isVegetarian: '',
    isVegan: '',
    general: ''
  });

  // Available categories for ingredients
  const ingredientCategories = [
    'nabiał', 'mięso', 'warzywa', 'owoce', 'pieczywo', 'zboża',
    'przyprawy', 'tłuszcze', 'napoje', 'środki czystości', 'inne'
  ];

  // Available categories for supplies (can be any string)
  const supplyCategories = [
    'sprzęt', 'chemia', 'inne'
  ];

  const availableCategories = isIngredient ? ingredientCategories : supplyCategories;

  const handleTypeChange = (newIsIngredient: boolean) => {
    setIsIngredient(newIsIngredient);
    // Reset ingredient-specific fields when switching away from ingredient
    if (!newIsIngredient) {
      setIsVegetarian(false);
      setIsVegan(false);
    }
    // Reset category if it's not valid for the new type
    if (!availableCategories.includes(category)) {
      setCategory('');
    }
  };

  const generateJson = () => {
    // Clear any previous errors
    setErrors({
      name: '',
      unit: '',
      category: '',
      isVegetarian: '',
      isVegan: '',
      general: ''
    });

    const supplyData = {
      name: name.trim(),
      unit: unit.trim(),
      category: category.trim(),
      description: description.trim() || undefined,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      isIngredient,
      ...(isIngredient && { isVegetarian, isVegan })
    };

    // Validate the data
    const validationErrors = validateNewSupply(supplyData);
    setErrors(validationErrors);

    if (!isSupplyDataValid(validationErrors)) {
      return null;
    }

    // Generate ID from name (slug format)
    const id = name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const supply: Supply | Ingredient = {
      id,
      name: name.trim(),
      unit: unit.trim(),
      category: category.trim(),
      description: description.trim() || undefined,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      isIngredient,
      ...(isIngredient && { isVegetarian, isVegan })
    };

    const jsonString = JSON.stringify(supply, null, 2);
    setJsonOutput(jsonString);
    return supply;
  };

  const copyToClipboard = () => {
    const supply = generateJson();
    if (supply) {
      navigator.clipboard.writeText(jsonOutput);
      alert('Supply JSON copied to clipboard!');
    }
  };

  const downloadJson = () => {
    const supply = generateJson();
    if (supply) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonOutput);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${name.trim() || 'new-supply'}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const resetForm = () => {
    setIsIngredient(false);
    setName('');
    setUnit('');
    setCategory('');
    setDescription('');
    setDefaultAmount('');
    setIsVegetarian(false);
    setIsVegan(false);
    setJsonOutput('');
    setErrors({
      name: '',
      unit: '',
      category: '',
      isVegetarian: '',
      isVegan: '',
      general: ''
    });
  };

  return (
    <div className="container-white-md p-6">
      <div className="space-y-section">
        {/* Type Selection */}
        <div>
          <h2 className="heading-secondary">Typ produktu</h2>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="supplyType"
                checked={!isIngredient}
                onChange={() => handleTypeChange(false)}
                className="mr-2"
              />
              Zaopatrzenie
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="supplyType"
                checked={isIngredient}
                onChange={() => handleTypeChange(true)}
                className="mr-2"
              />
              Składnik
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h2 className="heading-secondary">Informacje podstawowe</h2>

          <div className="form-group">
            <label className="form-label">Nazwa produktu *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-simple"
              placeholder="np. Mleko, Chleb, Środek do mycia"
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Jednostka *</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-simple"
              placeholder="np. litry, kg, sztuki"
            />
            {errors.unit && <p className="error-text">{errors.unit}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Kategoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-simple"
            >
              <option value="">Wybierz kategorię</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="error-text">{errors.category}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Domyślna ilość</label>
            <input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              className="input-simple"
              placeholder="np. 1, 2.5"
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Opis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-simple"
              rows={3}
              placeholder="Opcjonalny opis produktu"
            />
          </div>
        </div>

        {/* Ingredient-specific fields */}
        {isIngredient && (
          <div>
            <h2 className="heading-secondary">Właściwości składnika</h2>

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isVegetarian}
                  onChange={(e) => setIsVegetarian(e.target.checked)}
                  className="mr-2"
                />
                Wegetariański
              </label>
              {errors.isVegetarian && <p className="error-text">{errors.isVegetarian}</p>}
            </div>

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isVegan}
                  onChange={(e) => setIsVegan(e.target.checked)}
                  className="mr-2"
                />
                Wegański
              </label>
              {errors.isVegan && <p className="error-text">{errors.isVegan}</p>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={generateJson}
              className="btn-primary"
            >
              Wygeneruj JSON
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="btn-small btn-add"
            >
              Kopiuj do schowka
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="btn-small bg-purple-500 text-white hover:bg-purple-600"
            >
              Pobierz jako JSON
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-small bg-gray-500 text-white hover:bg-gray-600"
            >
              Wyczyść formularz
            </button>
          </div>

          {/* Display general error message */}
          {errors.general && (
            <div className="error-banner">
              {errors.general}
            </div>
          )}
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
