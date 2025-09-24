'use client';

import { useState, useEffect } from 'react';
import { Cruise, AggregatedShoppingList, AggregatedItem } from '../types';
import { aggregateShoppingList } from '../model/cruiseData';

interface ShoppingListTabProps {
  cruise: Cruise;
}

export default function ShoppingListTab({ cruise }: ShoppingListTabProps) {
  const [aggregatedList, setAggregatedList] = useState<AggregatedShoppingList>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const groupedItems = aggregateShoppingList(cruise);
    setAggregatedList(groupedItems);
  }, [cruise]);

  const toggleTooltip = (itemId: string) => {
    setActiveTooltip(activeTooltip === itemId ? null : itemId);
  };

  const generateCalculationTooltip = (item: AggregatedItem) => {
    let tooltipContent = '';

    // Add recipes
    const recipeSources = item.sources.filter(s => s.type === 'recipe');
    if (recipeSources.length > 0) {
      tooltipContent += `Z przepisów (załoga: ${cruise.crew} osób):\n`;
      recipeSources.forEach(source => {
        if (source.recipeName && source.dayNumber !== undefined) {
          const originalAmount = source.amount / cruise.crew;
          tooltipContent += `- ${source.recipeName} (dzień ${source.dayNumber}): ${originalAmount} ${item.supply.unit} × ${cruise.crew} załogantów = ${source.amount} ${item.supply.unit}\n`;
        }
      });
    }

    // Add additional supplies
    const additionalSources = item.sources.filter(s => s.type === 'additional');
    if (additionalSources.length > 0) {
      if (tooltipContent) tooltipContent += '\n';
      const totalAdditional = additionalSources.reduce((sum, source) => sum + source.amount, 0);
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
                  <li key={item.supply.id} className="py-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.supply.name}</span>
                      <div className="relative">
                        <span 
                          className="text-gray-700 cursor-pointer border-b border-dotted border-gray-400"
                          onClick={() => toggleTooltip(item.supply.id)}
                        >
                          {item.amount} {item.supply.unit}
                        </span>
                        <div className={`${activeTooltip === item.supply.id ? 'opacity-100 visible' : 'opacity-0 invisible'} 
                          w-64 md:w-256 bg-black text-white text-sm rounded p-2 absolute right-0 bottom-full mb-1 z-10 
                          transition-opacity whitespace-pre-wrap`}
                        >
                          {generateCalculationTooltip(item)}
                          <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                            <polygon className="fill-current" points="0,0 127.5,127.5 255,0"></polygon>
                          </svg>
                        </div>
                      </div>
                    </div>
                    {item.supply.description && (
                      <span className="text-sm text-gray-500 italic mt-1">{item.supply.description}</span>
                    )}
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
          oraz dodatkowych zakupów. Najedź/stuknij na ilość produktu, aby zobaczyć szczegóły obliczeń. Możesz wydrukować tę stronę lub zapisać ją jako PDF.          
        </p>
      </div>
    </div>
  );
}
