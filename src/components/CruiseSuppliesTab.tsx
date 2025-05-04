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
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number>(1);
  const [showIngredients, setShowIngredients] = useState<boolean>(false);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  
  // Load supplies directly, filtered by isIngredient flag
  useEffect(() => {
    setSupplies(getSuppliesByType(showIngredients));
  }, [showIngredients]);
  
  const handleAddSupply = () => {
    if (!cruise || !selectedSupplyId || selectedAmount <= 0) return;
    
    addAdditionalSupplyToCruise(cruise.id, selectedSupplyId, selectedAmount);
    
    // Notify parent component of the change
    onSupplyChange(cruise);
    
    // Reset form
    setSelectedSupplyId('');
    setSelectedAmount(1);
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
    // Reset selected supply when switching between types
    setSelectedSupplyId('');
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Dodatkowe zakupy</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - All supplies */}
        <div>
          <h2 className="text-lg font-bold mb-4">Dostępne zapasy</h2>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Dodaj zapasy</h3>
            <div className="grid gap-3">
              <div className="flex items-center mb-2">
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
              <div>
                <label className="block text-sm font-medium mb-1">Produkt</label>
                <select
                  value={selectedSupplyId}
                  onChange={(e) => setSelectedSupplyId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Wybierz produkt</option>
                  {supplies.map(supply => (
                    <option key={supply.id} value={supply.id}>
                      {supply.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ilość</label>
                <input
                  type="number"
                  min="1"
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <button
                onClick={handleAddSupply}
                disabled={!selectedSupplyId || selectedAmount <= 0}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Dodaj do listy zakupów
              </button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {supplies.length === 0 ? (
              <p className="text-gray-500 italic py-4">
                {showIngredients ? 
                  "Brak składników do wyświetlenia." : 
                  "Brak produktów do wyświetlenia."}
              </p>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Dostępne produkty</h3>
                <ul className="space-y-2">
                  {supplies.map(supply => (
                    <li key={supply.id} className="flex justify-between items-center py-1">
                      <span>{supply.name}</span>
                      <span className="text-sm text-gray-500">{supply.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
            <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
              {cruise.additionalSupplies.map(supply => {
                const supplyDetails = getSupplyById(supply.id);
                return (
                  <li 
                    key={supply.id} 
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">
                        {supplyDetails ? supplyDetails.name : supply.id}
                      </span>
                      {supplyDetails && (
                        <p className="text-sm text-gray-600 mt-1">
                          {showIngredients ? "Składnik" : "Produkt"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUpdateAmount(supply.id, Math.max(1, supply.amount - 1))}
                          className="px-2 py-1 bg-gray-200 rounded-l-md"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100">
                          {supply.amount} {supplyDetails?.unit || ''}
                        </span>
                        <button
                          onClick={() => handleUpdateAmount(supply.id, supply.amount + 1)}
                          className="px-2 py-1 bg-gray-200 rounded-r-md"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveSupply(supply.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Usuń
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 