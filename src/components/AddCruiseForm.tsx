'use client';

import { useState } from 'react';
import { createNewCruise, saveCruise } from '../model/cruiseData';
import { useRouter } from 'next/navigation';

export default function AddCruiseForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    length: 1,
    crew: 1,
    startDate: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    length: '',
    crew: '',
    startDate: ''
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
      crew: '',
      startDate: ''
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

    // startDate is optional

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
      formData.crew,
      formData.startDate || undefined
    );
    
    saveCruise(newCruise);
    router.push('/rejsy');
  };

  return (
    <div className="container-centered container-max-w-sm p-6 container-white">
      <h1 className="heading-primary mb-6">Dodaj nowy rejs</h1>

      <form onSubmit={handleSubmit} className="space-y-form">
        <div>
          <label htmlFor="name" className="form-label">
            Nazwa rejsu
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input-field ${
              errors.name ? 'input-field-error' : 'input-field-valid'
            }`}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="length" className="form-label">
            Długość rejsu (dni)
          </label>
          <input
            type="number"
            id="length"
            name="length"
            min="1"
            value={formData.length}
            onChange={handleChange}
            className={`input-field ${
              errors.length ? 'input-field-error' : 'input-field-valid'
            }`}
          />
          {errors.length && <p className="error-text">{errors.length}</p>}
        </div>

        <div>
          <label htmlFor="crew" className="form-label">
            Liczba załogantów
          </label>
          <input
            type="number"
            id="crew"
            name="crew"
            min="1"
            value={formData.crew}
            onChange={handleChange}
            className={`input-field ${
              errors.crew ? 'input-field-error' : 'input-field-valid'
            }`}
          />
          {errors.crew && <p className="error-text">{errors.crew}</p>}
        </div>

        <div>
          <label htmlFor="startDate" className="form-label">
            Data rozpoczęcia (opcjonalne)
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={`input-field ${
              errors.startDate ? 'input-field-error' : 'input-field-valid'
            }`}
          />
          {errors.startDate && <p className="error-text">{errors.startDate}</p>}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="btn-primary"
          >
            Zapisz rejs
          </button>
          <button
            type="button"
            onClick={() => router.push('/rejsy')}
            className="btn-secondary"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
