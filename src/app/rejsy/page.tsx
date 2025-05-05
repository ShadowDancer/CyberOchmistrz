'use client';

import { useSearchParams } from 'next/navigation';
import CruiseList from '../../components/CruiseList';
import CruiseDetail from '../../components/CruiseDetail';
import { Suspense } from 'react';

function Cruise(){
  const searchParams = useSearchParams();
  const cruiseId = searchParams.get('id');
  
  return (
    <div className="container mx-auto py-6 md:py-8 px-3 md:px-4 min-h-screen flex flex-col">
      {cruiseId ? (
        <CruiseDetail id={cruiseId} />
      ) : (
        <CruiseList />
      )}
    </div>
  );
}

export default function CruisesPage() {
  return <Suspense><Cruise /></Suspense>
} 