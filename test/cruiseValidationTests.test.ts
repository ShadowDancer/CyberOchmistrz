import { validateCruiseForm, isCruiseFormValid } from '../src/model/cruiseData';
import theories from 'jest-theories';

describe('Cruise Form Validation', () => {
  describe('validateCruiseForm', () => {
    const validationTheories = [
      {
        name: 'valid form data',
        input: { name: 'Test Cruise', length: 5, crew: 4 },
        expected: { name: '', length: '', crew: '', startDate: '' }
      },
      {
        name: 'empty name',
        input: { name: '', length: 5, crew: 4, startDate: '' },
        expected: { name: 'Nazwa rejsu jest wymagana', length: '', crew: '', startDate: '' }
      },
      {
        name: 'whitespace-only name',
        input: { name: '   ', length: 5, crew: 4, startDate: '' },
        expected: { name: 'Nazwa rejsu jest wymagana', length: '', crew: '', startDate: '' }
      },
      {
        name: 'length less than 1',
        input: { name: 'Test Cruise', length: 0, crew: 4, startDate: '' },
        expected: { name: '', length: 'Długość rejsu musi być większa niż 0', crew: '', startDate: '' }
      },
      {
        name: 'negative length',
        input: { name: 'Test Cruise', length: -1, crew: 4, startDate: '' },
        expected: { name: '', length: 'Długość rejsu musi być większa niż 0', crew: '', startDate: '' }
      },
      {
        name: 'length equal to 100',
        input: { name: 'Test Cruise', length: 100, crew: 4, startDate: '' },
        expected: { name: '', length: 'Długość rejsu nie może być większa niż 99 dni', crew: '', startDate: '' }
      },
      {
        name: 'length greater than 100',
        input: { name: 'Test Cruise', length: 101, crew: 4, startDate: '' },
        expected: { name: '', length: 'Długość rejsu nie może być większa niż 99 dni', crew: '', startDate: '' }
      },
      {
        name: 'crew less than 1',
        input: { name: 'Test Cruise', length: 5, crew: 0, startDate: '' },
        expected: { name: '', length: '', crew: 'Liczba załogantów musi być większa niż 0', startDate: '' }
      },
      {
        name: 'negative crew',
        input: { name: 'Test Cruise', length: 5, crew: -1, startDate: '' },
        expected: { name: '', length: '', crew: 'Liczba załogantów musi być większa niż 0', startDate: '' }
      },
      {
        name: 'crew equal to 100',
        input: { name: 'Test Cruise', length: 5, crew: 100, startDate: '' },
        expected: { name: '', length: '', crew: 'Liczba załogantów nie może być większa niż 99 osób', startDate: '' }
      },
      {
        name: 'crew greater than 100',
        input: { name: 'Test Cruise', length: 5, crew: 101, startDate: '' },
        expected: { name: '', length: '', crew: 'Liczba załogantów nie może być większa niż 99 osób', startDate: '' }
      },
      {
        name: 'multiple validation errors',
        input: { name: '', length: 0, crew: 0, startDate: '' },
        expected: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu musi być większa niż 0',
          crew: 'Liczba załogantów musi być większa niż 0',
          startDate: ''
        }
      },
      {
        name: 'all fields invalid',
        input: { name: '', length: 150, crew: 150, startDate: '' },
        expected: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu nie może być większa niż 99 dni',
          crew: 'Liczba załogantów nie może być większa niż 99 osób',
          startDate: ''
        }
      },
      {
        name: 'invalid start date',
        input: { name: 'Test Cruise', length: 5, crew: 4, startDate: 'invalid-date' },
        expected: { name: '', length: '', crew: '', startDate: 'Nieprawidłowa data rozpoczęcia' }
      },
      {
        name: 'valid start date',
        input: { name: 'Test Cruise', length: 5, crew: 4, startDate: '2025-10-15' },
        expected: { name: '', length: '', crew: '', startDate: '' }
      }
    ];

    theories('should validate cruise form data | {name}', validationTheories, (theory) => {
      const result = validateCruiseForm(theory.input);
      expect(result).toEqual(theory.expected);
    });
  });

  describe('isCruiseFormValid', () => {
    const validityTheories = [
      {
        name: 'valid errors object',
        input: { name: '', length: '', crew: '', startDate: '' },
        expected: true
      },
      {
        name: 'name error present',
        input: { name: 'Nazwa rejsu jest wymagana', length: '', crew: '', startDate: '' },
        expected: false
      },
      {
        name: 'length error present',
        input: { name: '', length: 'Długość rejsu musi być większa niż 0', crew: '', startDate: '' },
        expected: false
      },
      {
        name: 'crew error present',
        input: { name: '', length: '', crew: 'Liczba załogantów musi być większa niż 0', startDate: '' },
        expected: false
      },
      {
        name: 'multiple errors present',
        input: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu musi być większa niż 0',
          crew: 'Liczba załogantów musi być większa niż 0',
          startDate: ''
        },
        expected: false
      },
      {
        name: 'startDate error present',
        input: { name: '', length: '', crew: '', startDate: 'Nieprawidłowa data rozpoczęcia' },
        expected: false
      }
    ];

    theories('should determine if form is valid | {name}', validityTheories, (theory) => {
      const result = isCruiseFormValid(theory.input);
      expect(result).toBe(theory.expected);
    });
  });
});
