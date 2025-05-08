'use client';

import { useState, useEffect } from 'react';
import { Cruise, Supply } from '../types';
import { 
  addAdditionalSupplyToCruise,
  updateAdditionalSupplyAmount,
  removeAdditionalSupplyFromCruise
} from '../lib/cruiseData';
import { getSuppliesByType, getSupplyById } from '../lib/supplyData';

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
  const [suppliesByCategory, setSuppliesByCategory] = useState<{[key: string]: Supply[]}>({});
  const [shoppingListByCategory, setShoppingListByCategory] = useState<{[key: string]: {supply: Supply, amount: number}[]}>({});
  
  // Load supplies directly, filtered by isIngredient flag
  useEffect(() => {
    const allSupplies = getSuppliesByType(showIngredients);
    
    // Group supplies by category
    const grouped: {[key: string]: Supply[]} = {};
  
    // For ingredients, we can use their actual categories
    allSupplies.forEach(supply => {
      const category = supply.category || 'inne';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(supply);
    });
    
    setSuppliesByCategory(grouped);
    // Reset category filter when changing ingredient type
    setSelectedCategory('');
  }, [showIngredients]);
  
  // Group shopping list items by category
  useEffect(() => {
    if (!cruise.additionalSupplies) return;
    
    const groupedShoppingList: {[key: string]: {supply: Supply, amount: number}[]} = {};
    
    cruise.additionalSupplies.forEach(item => {
      const supplyDetails = getSupplyById(item.id);
      if (supplyDetails) {
        const category = supplyDetails.category || (supplyDetails.isIngredient ? 'inne' : 'Pozostałe produkty');
        
        if (!groupedShoppingList[category]) {
          groupedShoppingList[category] = [];
        }
        
        groupedShoppingList[category].push({
          supply: supplyDetails,
          amount: item.amount
        });
      }
    });
    
    setShoppingListByCategory(groupedShoppingList);
  }, [cruise.additionalSupplies]);
  
  const handleAddSupply = (supplyId: string) => {
    if (!cruise) return;
    
    // Check if the supply is already in the list
    const existingSupply = cruise.additionalSupplies?.find(item => item.id === supplyId);
    
    if (existingSupply) {
      // If already in list, increase amount
      handleUpdateAmount(supplyId, existingSupply.amount + 1);
    } else {
      // If not in list, add it
      addAdditionalSupplyToCruise(cruise.id, supplyId, 1);
      
      // Notify parent component of the change
      onSupplyChange(cruise);
    }
  };
  
  const handleUpdateAmount = (supplyId: string, amount: number) => {
    if (!cruise || amount < 0) return;
    
    updateAdditionalSupplyAmount(cruise.id, supplyId, amount);
    
    // Notify parent component of the change
    onSupplyChange(cruise);
  };
  
  const handleRemoveSupply = (supplyId: string) => {
    if (!cruise) return;
    
    removeAdditionalSupplyFromCruise(cruise.id, supplyId);
    
    // Notify parent component of the change
    onSupplyChange(cruise);
  };
  
  const toggleShowIngredients = () => {
    setShowIngredients(!showIngredients);
    setFilterText('');
  };
  
  // Filter supplies based on the search text and selected category
  const filteredSupplies = Object.keys(suppliesByCategory).reduce((acc, category) => {
    // Skip categories that don't match the selected category filter (if any)
    if (selectedCategory && category !== selectedCategory) {
      return acc;
    }
    
    const filteredCategory = suppliesByCategory[category].filter(supply => 
      supply.name.toLowerCase().includes(filterText.toLowerCase())
    );
    
    if (filteredCategory.length > 0) {
      acc[category] = filteredCategory;
    }
    
    return acc;
  }, {} as {[key: string]: Supply[]});
  
  // Get all available categories for the category filter
  const availableCategories = Object.keys(suppliesByCategory).sort();
  
  return (
    <div className="p-6">      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - All supplies */}
        <div>
          <h2 className="text-lg font-bold mb-4">Dostępne zapasy</h2>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Filtruj</h3>
              <div className="flex items-center">
                <input
                  id="show-ingredients"
                  type="checkbox"
                  checked={showIngredients}
                  onChange={toggleShowIngredients}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-ingredients" className="ml-2 block text-sm text-gray-900">
                  Pokaż składniki
                </label>
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Kategoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Wszystkie kategorie</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Szukaj produktu</label>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Wpisz nazwę produktu..."
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.keys(filteredSupplies).length === 0 ? (
              <p className="text-gray-500 italic py-4">Brak produktów do wyświetlenia.</p>
            ) : (
              Object.keys(filteredSupplies).map(category => (
                <div key={category} className="p-4 bg-gray-50 rounded-lg mb-4">
                  <h3 className="text-lg font-medium mb-2">{category}</h3>
                  <ul className="space-y-2">
                    {filteredSupplies[category].map(supply => (
                      <li key={supply.id} className="flex justify-between items-center py-1 border-b border-gray-200">
                        <div>
                          <span>{supply.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({supply.unit})</span>
                        </div>
                        <button
                          onClick={() => handleAddSupply(supply.id)}
                          className="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
                          title="Dodaj do listy zakupów"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
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
          <h2 className="text-lg font-bold mb-4">Lista zakupów</h2>
          {(!cruise.additionalSupplies || cruise.additionalSupplies.length === 0) ? (
            <p className="text-gray-500 italic py-4">
              Brak produktów na liście zakupów. Dodaj produkty z listy po lewej stronie.
            </p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {Object.keys(shoppingListByCategory).length === 0 ? (
                <p className="text-gray-500 italic py-4">Ładowanie...</p>
              ) : (
                Object.keys(shoppingListByCategory).sort().map(category => (
                  <div key={category} className="p-3 bg-gray-50 rounded-lg mb-2">
                    <h3 className="text-md font-medium mb-2 pb-1 border-b">{category}</h3>
                    <ul className="space-y-1">
                      {shoppingListByCategory[category].map(({supply, amount}) => (
                        <li 
                          key={supply.id} 
                          className="py-1 flex justify-between items-center text-sm"
                        >
                          <span className="font-medium">{supply.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-xs">
                              <button
                                onClick={() => handleUpdateAmount(supply.id, Math.max(1, amount - 1))}
                                className="px-1.5 py-0.5 bg-gray-200 rounded-l-md"
                              >
                                -
                              </button>
                              <span className="px-2 py-0.5 bg-gray-100">
                                {amount} {supply.unit}
                              </span>
                              <button
                                onClick={() => handleUpdateAmount(supply.id, amount + 1)}
                                className="px-1.5 py-0.5 bg-gray-200 rounded-r-md"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveSupply(supply.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="Usuń"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 