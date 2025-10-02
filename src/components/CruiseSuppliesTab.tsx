'use client';

import { useState, useEffect } from 'react';
import { Cruise, AdditionalSupplyCategoryGroup } from '../types';
import {
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise,
  getCruiseById,
  hasAdditionalSupply,
  getAdditionalSupplyAmount,
  groupAdditionalSuppliesByCategory
} from '../model/cruiseData';
import { getSuppliesByType, groupSuppliesByCategory } from '../model/supplyData';
import { CategoryGroup } from '../types';
import { declineUnit } from '../utils/polishDeclension';

interface CruiseSuppliesTabProps {
  cruise: Cruise;
  onSupplyChange: (updatedCruise: Cruise) => void;
}

export default function CruiseSuppliesTab({ 
  cruise, 
  onSupplyChange 
}: CruiseSuppliesTabProps) {
  const [showIngredients, setShowIngredients] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [suppliesByCategory, setSuppliesByCategory] = useState<CategoryGroup[]>([]);
  const [shoppingListByCategory, setShoppingListByCategory] = useState<AdditionalSupplyCategoryGroup[]>([]);
  
  // Load supplies directly, filtered by isIngredient flag
  useEffect(() => {
    const allSupplies = getSuppliesByType(showIngredients);

    // Group supplies by category using the domain function
    const grouped = groupSuppliesByCategory(allSupplies);

    setSuppliesByCategory(grouped);
    // Reset category filter when changing ingredient type
    setSelectedCategory('');
  }, [showIngredients]);
  
  // Group shopping list items by category using domain function
  useEffect(() => {
    const groupedShoppingList = groupAdditionalSuppliesByCategory(cruise.id);
    setShoppingListByCategory(groupedShoppingList);
  }, [cruise.additionalSupplies, cruise.id]);
  
  const handleAddSupply = (supplyId: string) => {
    if (!cruise) return;

    addAdditionalSupplyToCruise(cruise.id, supplyId, 1, false, false);
    
    const updatedCruise = getCruiseById(cruise.id);
    if (updatedCruise) {
      onSupplyChange(updatedCruise);
    }
  };

  const handleUpdateAmount = (supplyId: string, amount: number, isPerPerson: boolean, isPerDay: boolean) => {
    if (!cruise || amount < 0) return;

    updateAdditionalSupplyAmount(cruise.id, supplyId, amount, isPerPerson, isPerDay);

    const updatedCruise = getCruiseById(cruise.id);
    if (updatedCruise) {
      onSupplyChange(updatedCruise);
    }
  };

  const handleRemoveSupply = (supplyId: string, isPerPerson: boolean, isPerDay: boolean) => {
    if (!cruise) return;

    removeAdditionalSupplyFromCruise(cruise.id, supplyId, isPerPerson, isPerDay);

    const updatedCruise = getCruiseById(cruise.id);
    if (updatedCruise) {
      onSupplyChange(updatedCruise);
    }
  };

  const handleUpdateFlags = (supplyId: string, oldIsPerPerson: boolean, oldIsPerDay: boolean, newIsPerPerson: boolean, newIsPerDay: boolean, amount: number) => {
    if (!cruise) return;

    if (hasAdditionalSupply(cruise.id, supplyId, newIsPerPerson, newIsPerDay)) {
      const existingAmount = getAdditionalSupplyAmount(cruise.id, supplyId, newIsPerPerson, newIsPerDay);
      if (existingAmount !== null) {
        const confirmed = window.confirm(
          `Zmiana flag spowoduje połączenie z istniejącym wpisem (${existingAmount} ${declineUnit('sztuki', existingAmount)}). Czy chcesz kontynuować?`
        );
        if (!confirmed) return;
      }
    }

    removeAdditionalSupplyFromCruise(cruise.id, supplyId, oldIsPerPerson, oldIsPerDay);
    addAdditionalSupplyToCruise(cruise.id, supplyId, amount, newIsPerPerson, newIsPerDay);

    const updatedCruise = getCruiseById(cruise.id);
    if (updatedCruise) {
      onSupplyChange(updatedCruise);
    }
  };
  
  const toggleShowIngredients = () => {
    setShowIngredients(!showIngredients);
    setFilterText('');
  };
  
  const filteredSupplies = suppliesByCategory
    .filter(categoryGroup => !selectedCategory || categoryGroup.category === selectedCategory)
    .map(categoryGroup => ({
      ...categoryGroup,
      supplies: categoryGroup.supplies.filter(supply =>
        supply.name.toLowerCase().includes(filterText.toLowerCase())
      )
    }))
    .filter(categoryGroup => categoryGroup.supplies.length > 0);

  const availableCategories = suppliesByCategory.map(group => group.category).sort();
  
  return (
    <div className="content-padding">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column - All supplies */}
        <div>
          <h2 className="heading-secondary">Dostępne zapasy</h2>
          <div className="info-card mb-6">
            <div className="flex-between mb-4">
              <h3 className="text-lg font-medium">Filtruj</h3>
              <div className="flex items-center">
                <input
                  id="show-ingredients"
                  type="checkbox"
                  checked={showIngredients}
                  onChange={toggleShowIngredients}
                  className="h-4 w-4 text-link focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-ingredients" className="ml-2 block text-sm text-gray-900">
                  Pokaż składniki
                </label>
              </div>
            </div>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Kategoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">Wszystkie kategorie</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Szukaj produktu</label>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Wpisz nazwę produktu..."
                  className="input-field"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {filteredSupplies.length === 0 ? (
              <p className="text-muted-light italic py-4">Brak produktów do wyświetlenia.</p>
            ) : (
              filteredSupplies.map(categoryGroup => (
                <div key={categoryGroup.category} className="info-card">
                  <h3 className="section-header">{categoryGroup.category}</h3>
                  <ul className="space-y-2">
                    {categoryGroup.supplies.map(supply => (
                      <li key={supply.id} className="flex flex-col py-1 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <span>{supply.name}</span>
                            <span className="text-muted-light ml-2">({supply.unit})</span>
                          </div>
                          <button
                            onClick={() => handleAddSupply(supply.id)}
                            className="btn-add btn-small"
                            title="Dodaj do listy zakupów"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        {supply.description && (
                          <span className="text-muted-light italic mt-1">{supply.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Right column - Additional supplies to buy */}
        <div>
          <h2 className="heading-secondary">Lista zakupów</h2>
          {shoppingListByCategory.length === 0 ? (
            <p className="text-muted-light italic py-4">
              Brak produktów na liście zakupów. Dodaj produkty z listy po lewej stronie.
            </p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {shoppingListByCategory.map(categoryGroup => (
                <div key={categoryGroup.category} className="info-card">
                  <h3 className="section-header">{categoryGroup.category}</h3>
                  <ul className="space-y-1">
                    {categoryGroup.supplies.map(({supply, amount, isPerPerson, isPerDay}) => (
                      <li
                        key={`${supply.id}-${isPerPerson}-${isPerDay}`}
                        className="shopping-item"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{supply.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-xs">
                              <button
                                onClick={() => handleUpdateAmount(supply.id, Math.max(1, amount - 1), isPerPerson, isPerDay)}
                                className="btn-secondary px-1.5 py-0.5 rounded-l-md rounded-r-none text-xs"
                              >
                                -
                              </button>
                              <span className="px-2 py-0.5 bg-gray-100 border dark:bg-gray-700 dark:border-gray-600">
                                {amount} {declineUnit(supply.unit, amount)}
                              </span>
                              <button
                                onClick={() => handleUpdateAmount(supply.id, amount + 1, isPerPerson, isPerDay)}
                                className="btn-secondary px-1.5 py-0.5 rounded-r-md rounded-l-none text-xs"
                              >
                                +
                              </button>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isPerPerson}
                                  onChange={(e) => handleUpdateFlags(supply.id, isPerPerson, isPerDay, e.target.checked, isPerDay, amount)}
                                  className="h-3 w-3 text-link focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-1">na osobę</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isPerDay}
                                  onChange={(e) => handleUpdateFlags(supply.id, isPerPerson, isPerDay, isPerPerson, e.target.checked, amount)}
                                  className="h-3 w-3 text-link focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-1">na dzień</span>
                              </label>
                            </div>
                            <button
                              onClick={() => handleRemoveSupply(supply.id, isPerPerson, isPerDay)}
                              className="btn-remove btn-small"
                              title="Usuń"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {supply.description && (
                          <span className="shopping-item-description">{supply.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
