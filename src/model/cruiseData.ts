import { Cruise } from './cruise';

const STORAGE_KEY = 'cyber-ochmistrz-cruises';

export function getCruises(): Cruise[] {
  if (typeof window === 'undefined') return [];

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

  if (existingIndex < 0) {
    cruises.push(cruise);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cruises));
}

export function deleteCruise(id: string): void {
  if (typeof window === 'undefined') return;

  const cruises = getCruises().filter(cruise => cruise.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cruises));
}
