'use client';

import EditCruiseForm from '../../../components/EditCruiseForm';
import {getCruiseById} from '../../../model/cruiseData';
import {Suspense} from "react";
import { useSearchParams } from 'next/navigation';

function EditCruiseContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return (
            <div className="container-centered container-max-w-sm p-6 container-white">
                <p className="text-xl text-muted-dark">Brak identyfikatora rejsu</p>
            </div>
        );
    }

    const cruise = getCruiseById(id);

    if (!cruise) {
        return (
            <div className="container-centered container-max-w-sm p-6 container-white">
                <p className="text-xl text-muted-dark">Nie znaleziono rejsu</p>
            </div>
        );
    }

    return <EditCruiseForm cruise={cruise}/>;
}

export default function EditCruisePage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <Suspense fallback={<div>Loading...</div>}>
                <EditCruiseContent />
            </Suspense>
        </div>
    );
}
