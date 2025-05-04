'use client';

import { useState } from 'react';
import { createNewCruise, saveCruise } from '../lib/cruiseData';
import { useRouter } from 'next/navigation';

export default function AddCruiseForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    length: 1,
    crew: 1
  });
  const [errors, setErrors] = useState({
    name: '',
    length: '',
    crew: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      length: '',
      crew: ''
    };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa rejsu jest wymagana';
    }
    
    if (formData.length < 1) {
      newErrors.length = 'Długość rejsu musi być większa niż 0';
    }
    
    if (formData.crew < 1) {
      newErrors.crew = 'Liczba załogantów musi być większa niż 0';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const newCruise = createNewCruise(
      formData.name,
      formData.length,
      formData.crew
    );
    
    saveCruise(newCruise);
    router.push('/rejsy');
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Dodaj nowy rejs</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nazwa rejsu
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
            Długość rejsu (dni)
          </label>
          <input
            type="number"
            id="length"
            name="length"
            min="1"
            value={formData.length}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.length ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.length && <p className="mt-1 text-sm text-red-600">{errors.length}</p>}
        </div>
        
        <div>
          <label htmlFor="crew" className="block text-sm font-medium text-gray-700 mb-1">
            Liczba załogantów
          </label>
          <input
            type="number"
            id="crew"
            name="crew"
            min="1"
            value={formData.crew}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.crew ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.crew && <p className="mt-1 text-sm text-red-600">{errors.crew}</p>}
        </div>
        
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Zapisz rejs
          </button>
          <button
            type="button"
            onClick={() => router.push('/rejsy')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
} 