'use client';

import { useState, useEffect } from 'react';
import { Cruise, Supply } from '../types';
import { getSupplyById, getIngredientById } from '../lib/supplyData';
import { getRecipeById } from '../lib/recipieData';

interface ShoppingListTabProps {
  cruise: Cruise;
}

interface AmountSource {
  type: 'recipe' | 'additional';
  amount: number;
  recipeName?: string;
  dayNumber?: number;
}

interface AggregatedItem {
  supply: Supply;
  amount: number;
  sources: AmountSource[];
}

export default function ShoppingListTab({ cruise }: ShoppingListTabProps) {
  const [aggregatedList, setAggregatedList] = useState<{[key: string]: AggregatedItem[]}>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const aggregateShoppingList = () => {
      // Map to hold all items with their total amounts and sources
      const itemsMap: Map<string, { supply: Supply, amount: number, sources: AmountSource[] }> = new Map();
      
      // 1. Add ingredients from recipes in the meal plan
      cruise.days.forEach(day => {
        day.recipes.forEach(recipeId => {
          const recipe = getRecipeById(recipeId);
          if (recipe) {
            recipe.ingredients.forEach(ingredientAmount => {
              const ingredient = getIngredientById(ingredientAmount.id);
              if (ingredient) {
                // Adjust amount based on crew size
                const scaledAmount = ingredientAmount.amount * cruise.crew;
                const source: AmountSource = {
                  type: 'recipe',
                  amount: scaledAmount,
                  recipeName: recipe.name,
                  dayNumber: day.dayNumber
                };
                
                if (itemsMap.has(ingredient.id)) {
                  // Add to existing item
                  const existingItem = itemsMap.get(ingredient.id)!;
                  existingItem.amount += scaledAmount;
                  existingItem.sources.push(source);
                } else {
                  // Add new item
                  itemsMap.set(ingredient.id, {
                    supply: ingredient,
                    amount: scaledAmount,
                    sources: [source]
                  });
                }
              }
            });
          }
        });
      });
      
      // 2. Add items from additional supplies
      if (cruise.additionalSupplies) {
        cruise.additionalSupplies.forEach(item => {
          const supply = getSupplyById(item.id);
          if (supply) {
            const source: AmountSource = {
              type: 'additional',
              amount: item.amount
            };
            
            if (itemsMap.has(supply.id)) {
              // Add to existing item
              const existingItem = itemsMap.get(supply.id)!;
              existingItem.amount += item.amount;
              existingItem.sources.push(source);
            } else {
              // Add new item
              itemsMap.set(supply.id, {
                supply,
                amount: item.amount,
                sources: [source]
              });
            }
          }
        });
      }
      
      // Group items by category
      const groupedItems: {[key: string]: AggregatedItem[]} = {};
      
      itemsMap.forEach((item) => {
        const category = item.supply.category || (item.supply.isIngredient ? 'inne' : 'Pozostałe produkty');
        
        if (!groupedItems[category]) {
          groupedItems[category] = [];
        }
        
        groupedItems[category].push(item);
      });
      
      // Sort items in each category alphabetically
      Object.keys(groupedItems).forEach(category => {
        groupedItems[category].sort((a, b) => a.supply.name.localeCompare(b.supply.name, 'pl'));
      });
      
      return groupedItems;
    };
    
    const groupedItems = aggregateShoppingList();
    setAggregatedList(groupedItems);
    setLoading(false);
  }, [cruise]);

  if (loading) {
    return <div className="p-6 text-center">Przygotowywanie listy zakupów...</div>;
  }

  // Generate tooltip content for an item
  const generateCalculationTooltip = (item: AggregatedItem) => {
    const recipeItems = item.sources.filter(s => s.type === 'recipe');
    const additionalItems = item.sources.filter(s => s.type === 'additional');
    
    // Group by recipe
    const recipeGroups: Record<string, {dayNumber: number, amount: number, originalAmount: number}[]> = {};
    recipeItems.forEach(source => {
      if (source.recipeName) {
        if (!recipeGroups[source.recipeName]) {
          recipeGroups[source.recipeName] = [];
        }
        // Store both scaled and original amounts
        recipeGroups[source.recipeName].push({
          dayNumber: source.dayNumber!,
          amount: source.amount,
          originalAmount: source.amount / cruise.crew // Calculate original recipe amount before crew scaling
        });
      }
    });
    
    let tooltipContent = '';
    
    // Add recipe info
    if (Object.keys(recipeGroups).length > 0) {
      tooltipContent += `Z przepisów (załoga: ${cruise.crew} osób):\n`;
      Object.entries(recipeGroups).forEach(([recipeName, occurrences]) => {
        // Group by amount
        const amountGroups: Record<string, number[]> = {};
        occurrences.forEach(occ => {
          const key = `${occ.originalAmount}:${occ.amount}`;
          if (!amountGroups[key]) {
            amountGroups[key] = [];
          }
          amountGroups[key].push(occ.dayNumber);
        });
        
        Object.entries(amountGroups).forEach(([amountKey, days]) => {
          days.sort((a, b) => a - b);
          const [originalAmount, scaledAmount] = amountKey.split(':').map(Number);
          tooltipContent += `- ${recipeName} (dzień ${days.join(', ')}): ${originalAmount} ${item.supply.unit} × ${cruise.crew} załogantów = ${scaledAmount} ${item.supply.unit}\n`;
        });
      });
    }
    
    // Add additional supplies info
    if (additionalItems.length > 0) {
      if (tooltipContent) tooltipContent += '\n';
      const totalAdditional = additionalItems.reduce((sum, item) => sum + item.amount, 0);
      tooltipContent += `Z dodatkowych zakupów: ${totalAdditional} ${item.supply.unit}`;
    }
    
    return tooltipContent;
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Lista zakupów</h2>
      
      {Object.keys(aggregatedList).length === 0 ? (
        <p className="text-gray-500 italic py-4">
          Brak produktów na liście zakupów. Dodaj produkty z poziomu planu posiłków lub dodatkowych zakupów.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.keys(aggregatedList).sort().map(category => (
            <div key={category} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3 pb-1 border-b">{category}</h3>
              <ul className="space-y-2">
                {aggregatedList[category].map(item => (
                  <li key={item.supply.id} className="py-1 flex justify-between items-center group">
                    <span className="font-medium">{item.supply.name}</span>
                    <div className="relative">
                      <span className="text-gray-700 cursor-help border-b border-dotted border-gray-400">
                        {item.amount} {item.supply.unit}
                      </span>
                      <div className="opacity-0 w-256 bg-black text-white text-sm rounded p-2 absolute right-0 bottom-full mb-1 z-10 group-hover:opacity-100 transition-opacity whitespace-pre-wrap">
                        {generateCalculationTooltip(item)}
                        <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"></polygon></svg>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-md font-medium mb-2">Wskazówki</h3>
        <p className="text-sm text-gray-600">
          Ta lista zawiera wszystkie produkty zebrane z planu posiłków (skalowane do liczby załogantów) 
          oraz dodatkowych zakupów. Najedź na produkt, aby zobaczyć szczegóły obliczeń. Możesz wydrukować tę stronę lub zapisać ją jako PDF.          
        </p>
      </div>
    </div>
  );
} 