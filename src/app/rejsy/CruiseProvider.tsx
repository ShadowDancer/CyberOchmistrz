import { createContext, ReactNode, useContext, useState } from 'react';
import { Cruise } from '@/model/cruise';
import { saveCruise, getCruiseById } from '@/model/cruiseData';

type CruiseContextValue = {
  cruise: Cruise,
  setCruise: (cruise: Cruise) => void
}

type CruiseProviderProps = {
  cruiseId: string,
  children: ReactNode
}

const CruiseContext = createContext<CruiseContextValue>(null!);

export function CruiseProvider({ cruiseId, children }: CruiseProviderProps) {
  const initialCruise = getCruiseById(cruiseId);
  if (initialCruise === undefined) {
    throw new Error(`could not find cruise ${cruiseId}`);
  }

  const [cruise, setCruiseState] = useState<Cruise>(initialCruise);

  const setCruise = (cruise: Cruise) => {
    saveCruise(cruise);
    setCruiseState(cruise);
  }

  const value: CruiseContextValue = {cruise, setCruise};

  return (
  <CruiseContext.Provider value={value}>
    {children}
  </CruiseContext.Provider>)
}

export function useCruise(): CruiseContextValue {
  const context = useContext(CruiseContext);
  if (context === null) {
    throw new Error('useCruise must be used within CruiseProvider');
  }
  return context;
}
