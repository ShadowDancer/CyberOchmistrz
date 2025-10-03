"use client";

import { useState, useMemo } from 'react';
import suppliesData from '@/data/supplies.json';
import { Supply, Ingredient } from '@/types';

export default function SuppliesPage() {
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'vegetarian' | 'vegan'>('all');
  const [showIngredientsOnly, setShowIngredientsOnly] = useState<boolean>(false);

  // Get unique categories from supplies data
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(suppliesData.map((supply: Supply) => supply.category)));
    return uniqueCategories.sort();
  }, []);

  // Filter supplies based on current filters
  const filteredSupplies = useMemo(() => {
    return suppliesData.filter((supply: Supply) => {
      // Text search filter
      if (searchText && !supply.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && supply.category !== selectedCategory) {
        return false;
      }

      // Dietary filter - only apply to ingredients
      if (dietFilter === 'vegetarian' && supply.isIngredient && (supply as Ingredient).isVegetarian === false) {
        return false;
      }
      if (dietFilter === 'vegan' && supply.isIngredient && (supply as Ingredient).isVegan === false) {
        return false;
      }

      // Ingredient type filter
      if (showIngredientsOnly && !supply.isIngredient) {
        return false;
      }

      return true;
    });
  }, [searchText, selectedCategory, dietFilter, showIngredientsOnly]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Składniki</h1>
      </div>

      {/* Filters Section */}
      <div className="container-white p-4 mb-6">
        <div className="section-header">Filtry</div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Text Search */}
          <div>
            <label className="form-label">Szukaj</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Nazwa składnika..."
              className="input-field"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="form-label">Kategoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">Wszystkie kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Dietary Filters */}
          <div>
            <label className="form-label">Dieta</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDietFilter('all')}
                className={`btn-filter ${dietFilter === 'all' ? 'btn-filter-active' : 'btn-filter-inactive'}`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setDietFilter('vegetarian')}
                className={`btn-filter ${dietFilter === 'vegetarian' ? 'btn-filter-active-green' : 'btn-filter-inactive'}`}
              >
                Wegetariańskie
              </button>
              <button
                onClick={() => setDietFilter('vegan')}
                className={`btn-filter ${dietFilter === 'vegan' ? 'btn-filter-active-green' : 'btn-filter-inactive'}`}
              >
                Wegańskie
              </button>
            </div>
          </div>

          {/* Ingredient Type Filter */}
          <div>
            <label className="form-label">Typ</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowIngredientsOnly(false)}
                className={`btn-filter ${!showIngredientsOnly ? 'btn-filter-active' : 'btn-filter-inactive'}`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setShowIngredientsOnly(true)}
                className={`btn-filter ${showIngredientsOnly ? 'btn-filter-active' : 'btn-filter-inactive'}`}
              >
                Tylko składniki
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-muted">
          Znaleziono {filteredSupplies.length} składnik{filteredSupplies.length !== 1 ? 'ów' : 'a'}
        </p>
      </div>

      {/* Supplies List */}
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {filteredSupplies.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Brak składników spełniających kryteria filtrowania.</p>
          </div>
        ) : (
          filteredSupplies.map((supply: Supply) => (
            <div key={supply.id} className="list-item-border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{supply.name}</h3>
                    {supply.isIngredient && (supply as Ingredient).isVegetarian && (
                      <span className="badge-vegetarian">V</span>
                    )}
                    {supply.isIngredient && (supply as Ingredient).isVegan && (
                      <span className="badge-vegan">VG</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-light">Jednostka:</span>
                      <span className="ml-2">{supply.unit}</span>
                    </div>
                    <div>
                      <span className="text-muted-light">Kategoria:</span>
                      <span className="ml-2">{supply.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-light">Typ:</span>
                      <span className="ml-2">{supply.isIngredient ? 'Składnik' : 'Zaopatrzenie'}</span>
                    </div>
                    {supply.defaultAmount && (
                      <div>
                        <span className="text-muted-light">Domyślna ilość:</span>
                        <span className="ml-2">{supply.defaultAmount}</span>
                      </div>
                    )}
                  </div>

                  {supply.description && (
                    <div className="mt-2">
                      <p className="text-muted text-sm italic">{supply.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
