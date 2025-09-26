'use client';

import { useState, useEffect } from 'react';
import { Cruise, AggregatedShoppingList, AggregatedItem, RecipeAmountSource, AdditionalSupplyAmountSource } from '../types';
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
    const recipeSources = item.sources.filter(s => s.type === 'recipe') as RecipeAmountSource[];
    if (recipeSources.length > 0) {
      tooltipContent += `Z przepisów (załoga: ${cruise.crew} osób):\n`;
      recipeSources.forEach(source => {
        if (source.recipeName && source.dayNumber !== undefined) {
          const scaledAmount = source.amount * cruise.crew;
          tooltipContent += `- ${source.recipeName} (dzień ${source.dayNumber}): ${source.amount} ${item.supply.unit} × ${cruise.crew} załogantów = ${scaledAmount} ${item.supply.unit}\n`;
        }
      });
    }

    // Add additional supplies
    const additionalSources = item.sources.filter(s => s.type === 'additional') as AdditionalSupplyAmountSource[];
    if (additionalSources.length > 0) {
      if (tooltipContent) tooltipContent += '\n';
      tooltipContent += `Z dodatkowych zakupów:\n`;
      additionalSources.forEach(source => {
        const crewMultiplier = source.isPerPerson ? cruise.crew : 1;
        const dayMultiplier = source.isPerDay ? cruise.length : 1;
        const scaledAmount = source.amount * crewMultiplier * dayMultiplier;
        let calculation = `${source.amount} ${item.supply.unit}`;
        if (source.isPerPerson) calculation += ` × ${cruise.crew} załogantów`;
        if (source.isPerDay) calculation += ` × ${cruise.length} dni`;
        calculation += ` = ${scaledAmount} ${item.supply.unit}`;
        tooltipContent += `- ${calculation}\n`;
      });
    }

    return tooltipContent.trim();
  };

  return (
    <div className="content-padding">
      <h2 className="heading-secondary">Lista zakupów</h2>

      {Object.keys(aggregatedList).length === 0 ? (
        <p className="text-muted italic py-4">
          Brak produktów na liście zakupów. Dodaj produkty z poziomu planu posiłków lub dodatkowych zakupów.
        </p>
      ) : (
        <div className="content-section">
          {Object.keys(aggregatedList).sort().map(category => (
            <div key={category} className="shopping-category">
              <h3 className="section-header">{category}</h3>
              <ul className="space-y-2">
                {aggregatedList[category].map(item => (
                  <li key={item.supply.id} className="shopping-item">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.supply.name}</span>
                      <div className="relative">
                        <span
                          className="shopping-item-amount"
                          onClick={() => toggleTooltip(item.supply.id)}
                        >
                          {item.amount} {item.supply.unit}
                        </span>
                        <div className={`tooltip ${activeTooltip === item.supply.id ? 'tooltip-visible' : 'tooltip-hidden'}`}
                        >
                          {generateCalculationTooltip(item)}
                          <div className="tooltip-arrow">
                            <svg x="0px" y="0px" viewBox="0 0 255 255">
                              <polygon className="fill-current" points="0,0 127.5,127.5 255,0"></polygon>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {item.supply.description && (
                      <span className="shopping-item-description">{item.supply.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 border-t pt-4">
        <h3 className="subsection-header">Wskazówki</h3>
        <p className="text-sm text-muted-dark">
          Ta lista zawiera wszystkie produkty zebrane z planu posiłków (skalowane do liczby załogantów)
          oraz dodatkowych zakupów. Najedź/stuknij na ilość produktu, aby zobaczyć szczegóły obliczeń. Możesz wydrukować tę stronę lub zapisać ją jako PDF.
        </p>
      </div>
    </div>
  );
}
