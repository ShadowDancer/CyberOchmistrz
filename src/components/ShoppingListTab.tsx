'use client';

import { useState, useEffect } from 'react';
import { Cruise, AggregatedShoppingList, AggregatedItem, RecipeAmountSource, AdditionalSupplyAmountSource } from '../types';
import { aggregateShoppingList, generateShoppingListCSV } from '../model/cruiseData';
import { declineUnit } from '../utils/polishDeclension';

interface ShoppingListTabProps {
  cruise: Cruise;
}

export default function ShoppingListTab({ cruise }: ShoppingListTabProps) {
  const [aggregatedList, setAggregatedList] = useState<AggregatedShoppingList>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const groupedItems = aggregateShoppingList(cruise);
    setAggregatedList(groupedItems);
  }, [cruise]);

  const toggleAccordion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const downloadCSV = () => {
    const csvContent = generateShoppingListCSV(aggregatedList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lista-zakupow-${cruise.name}-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateCalculationTooltip = (item: AggregatedItem) => {
    let tooltipContent = '';

    // Add recipes
    const recipeSources = item.sources.filter(s => s.type === 'recipe') as RecipeAmountSource[];
    if (recipeSources.length > 0) {
      tooltipContent += `Z przepisów (załoga: ${cruise.crewMembers.length} osób):\n`;
      recipeSources.forEach(source => {
        if (source.recipeName && source.dayNumber !== undefined) {
          const scaledAmount = source.amount * cruise.crewMembers.length;
          tooltipContent += `- ${source.recipeName} (dzień ${source.dayNumber}): ${source.amount} ${declineUnit(item.supply.unit, source.amount)} × ${cruise.crewMembers.length} ${declineUnit('załogant', cruise.crewMembers.length)} = ${scaledAmount} ${declineUnit(item.supply.unit, scaledAmount)}\n`;
        }
      });
    }

    // Add additional supplies
    const additionalSources = item.sources.filter(s => s.type === 'additional') as AdditionalSupplyAmountSource[];
    if (additionalSources.length > 0) {
      if (tooltipContent) tooltipContent += '\n';
      tooltipContent += `Z dodatkowych zakupów:\n`;
      additionalSources.forEach(source => {
        const crewMultiplier = source.isPerPerson ? cruise.crewMembers.length : 1;
        const dayMultiplier = source.isPerDay ? cruise.length : 1;
        const scaledAmount = source.amount * crewMultiplier * dayMultiplier;
        let calculation = `${source.amount} ${declineUnit(item.supply.unit, source.amount)}`;
        if (source.isPerPerson) calculation += ` × ${cruise.crewMembers.length} ${declineUnit('załogant', cruise.crewMembers.length)}`;
        if (source.isPerDay) calculation += ` × ${cruise.length} dni`;
        if (source.isPerPerson || source.isPerDay){
          calculation += ` = ${scaledAmount} ${declineUnit(item.supply.unit, scaledAmount)}`;
        }
        tooltipContent += `- ${calculation}\n`;
      });
    }

    return tooltipContent.trim();
  };

  return (
    <div className="content-padding">
      <div className="flex justify-between items-center mb-4">
        <h2 className="heading-secondary">Lista zakupów</h2>
        {Object.keys(aggregatedList).length > 0 && (
          <button
            onClick={downloadCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Pobierz CSV
          </button>
        )}
      </div>

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
                {aggregatedList[category].map(item => {
                  const isExpanded = expandedItems.has(item.supply.id);
                  return (
                    <li key={item.supply.id} className="shopping-item">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.supply.name}</span>
                        <button
                          className="shopping-item-amount flex items-center gap-1"
                          onClick={() => toggleAccordion(item.supply.id)}
                        >
                          {item.amount} {declineUnit(item.supply.unit, item.amount)}
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {item.supply.description && (
                        <span className="shopping-item-description">{item.supply.description}</span>
                      )}
                      {isExpanded && (
                        <div className="accordion-content mt-2 p-3 bg-gray-50 rounded-md dark:bg-gray-800">
                          <div className="text-sm whitespace-pre-wrap">
                            {generateCalculationTooltip(item)}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 border-t pt-4">
        <h3 className="subsection-header">Wskazówki</h3>
        <p className="text-sm text-muted-dark">
          Ta lista zawiera wszystkie produkty zebrane z planu posiłków (skalowane do liczby załogantów)
          oraz dodatkowych zakupów. Kliknij na ilość produktu, aby rozwinąć szczegóły obliczeń. Możesz wydrukować tę stronę lub zapisać ją jako PDF.
        </p>
      </div>
    </div>
  );
}
