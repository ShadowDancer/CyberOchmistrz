import { Cruise } from '../types';

const STORAGE_KEY = 'cyber-ochmistrz-cruises';

// Function to check and update cruises to add the days property if missing
function migrateCruises(): void {
  if (typeof window === 'undefined') return;
  
  const storedCruises = localStorage.getItem(STORAGE_KEY);
  if (!storedCruises) return;
  
  try {
    const cruises = JSON.parse(storedCruises) as Cruise[];
    let hasChanges = false;
    
    const updatedCruises = cruises.map(cruise => {
      const updatedCruise = { ...cruise };
      let needsUpdate = false;
      
      if (!updatedCruise.days) {
        // Create days array based on cruise length
        const days = Array.from({ length: updatedCruise.length }, (_, i) => ({
          dayNumber: i + 1,
          recipes: []
        }));
        updatedCruise.days = days;
        needsUpdate = true;
      }
      
      if (!updatedCruise.additionalSupplies) {
        updatedCruise.additionalSupplies = [];
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        hasChanges = true;
      }
      
      return updatedCruise;
    });
    
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCruises));
    }
  } catch (error) {
    console.error('Failed to migrate cruises:', error);
  }
}

export function getCruises(): Cruise[] {
  if (typeof window === 'undefined') return [];
  
  // Run migration to ensure all cruises have the days property
  migrateCruises();
  
  const storedCruises = localStorage.getItem(STORAGE_KEY);
  return storedCruises ? JSON.parse(storedCruises) : [];
}

export function getCruiseById(id: string): Cruise | undefined {
  return getCruises().find(cruise => cruise.id === id);
}

export function saveCruise(cruise: Cruise): void {
  if (typeof window === 'undefined') return;
  
  const cruises = getCruises();
  const existingIndex = cruises.findIndex(c => c.id === cruise.id);
  
  if (existingIndex >= 0) {
    cruises[existingIndex] = {
      ...cruise,
      dateModified: new Date().toISOString()
    };
  } else {
    cruises.push(cruise);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cruises));
}

export function deleteCruise(id: string): void {
  if (typeof window === 'undefined') return;
  
  const cruises = getCruises().filter(cruise => cruise.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cruises));
}

export function createNewCruise(name: string, length: number, crew: number): Cruise {
  const now = new Date().toISOString();
  
  // Create an array of days with empty recipe arrays
  const days = Array.from({ length }, (_, i) => ({
    dayNumber: i + 1,
    recipes: []
  }));
  
  return {
    id: Date.now().toString(),
    name,
    dateCreated: now,
    dateModified: now,
    length,
    crew,
    days
  };
}

export function addRecipeToCruiseDay(cruiseId: string, dayNumber: number, recipeId: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  // Add recipe if it doesn't already exist
  if (!cruise.days[dayIndex].recipes.includes(recipeId)) {
    cruise.days[dayIndex].recipes.push(recipeId);
    saveCruise(cruise);
  }
}

export function removeRecipeFromCruiseDay(cruiseId: string, dayNumber: number, recipeId: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  const dayIndex = cruise.days.findIndex(day => day.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  
  cruise.days[dayIndex].recipes = cruise.days[dayIndex].recipes.filter(id => id !== recipeId);
  saveCruise(cruise);
}

// Function to add a supply to a cruise's additional supplies list
export function addAdditionalSupplyToCruise(cruiseId: string, supplyId: string, amount: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  
  // Initialize additional supplies array if it doesn't exist
  if (!cruise.additionalSupplies) {
    cruise.additionalSupplies = [];
  }
  
  // Check if the supply already exists
  const existingSupplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId);
  
  if (existingSupplyIndex >= 0) {
    // Update existing supply
    cruise.additionalSupplies[existingSupplyIndex].amount = amount;
  } else {
    // Add new supply
    cruise.additionalSupplies.push({ id: supplyId, amount });
  }
  
  saveCruise(cruise);
}

// Function to update the amount of an additional supply
export function updateAdditionalSupplyAmount(cruiseId: string, supplyId: string, amount: number): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return;
  
  const supplyIndex = cruise.additionalSupplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) return;
  
  cruise.additionalSupplies[supplyIndex].amount = amount;
  saveCruise(cruise);
}

// Function to remove a supply from a cruise's additional supplies list
export function removeAdditionalSupplyFromCruise(cruiseId: string, supplyId: string): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise || !cruise.additionalSupplies) return;
  
  cruise.additionalSupplies = cruise.additionalSupplies.filter(s => s.id !== supplyId);
  saveCruise(cruise);
} 