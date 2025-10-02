import { validateCruiseForm, isCruiseFormValid } from '../src/model/cruiseData';
import theories from 'jest-theories';

describe('Cruise Form Validation', () => {
  describe('validateCruiseForm', () => {
    const validationTheories = [
      {
        name: 'valid form data',
        input: { name: 'Test Cruise', length: 5, crew: 4 },
        expected: { name: '', length: '', crew: '' }
      },
      {
        name: 'empty name',
        input: { name: '', length: 5, crew: 4 },
        expected: { name: 'Nazwa rejsu jest wymagana', length: '', crew: '' }
      },
      {
        name: 'whitespace-only name',
        input: { name: '   ', length: 5, crew: 4 },
        expected: { name: 'Nazwa rejsu jest wymagana', length: '', crew: '' }
      },
      {
        name: 'length less than 1',
        input: { name: 'Test Cruise', length: 0, crew: 4 },
        expected: { name: '', length: 'Długość rejsu musi być większa niż 0', crew: '' }
      },
      {
        name: 'negative length',
        input: { name: 'Test Cruise', length: -1, crew: 4 },
        expected: { name: '', length: 'Długość rejsu musi być większa niż 0', crew: '' }
      },
      {
        name: 'length equal to 100',
        input: { name: 'Test Cruise', length: 100, crew: 4 },
        expected: { name: '', length: 'Długość rejsu nie może być większa niż 99 dni', crew: '' }
      },
      {
        name: 'length greater than 100',
        input: { name: 'Test Cruise', length: 101, crew: 4 },
        expected: { name: '', length: 'Długość rejsu nie może być większa niż 99 dni', crew: '' }
      },
      {
        name: 'crew less than 1',
        input: { name: 'Test Cruise', length: 5, crew: 0 },
        expected: { name: '', length: '', crew: 'Liczba załogantów musi być większa niż 0' }
      },
      {
        name: 'negative crew',
        input: { name: 'Test Cruise', length: 5, crew: -1 },
        expected: { name: '', length: '', crew: 'Liczba załogantów musi być większa niż 0' }
      },
      {
        name: 'crew equal to 100',
        input: { name: 'Test Cruise', length: 5, crew: 100 },
        expected: { name: '', length: '', crew: 'Liczba załogantów nie może być większa niż 99 osób' }
      },
      {
        name: 'crew greater than 100',
        input: { name: 'Test Cruise', length: 5, crew: 101 },
        expected: { name: '', length: '', crew: 'Liczba załogantów nie może być większa niż 99 osób' }
      },
      {
        name: 'multiple validation errors',
        input: { name: '', length: 0, crew: 0 },
        expected: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu musi być większa niż 0',
          crew: 'Liczba załogantów musi być większa niż 0'
        }
      },
      {
        name: 'all fields invalid',
        input: { name: '', length: 150, crew: 150 },
        expected: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu nie może być większa niż 99 dni',
          crew: 'Liczba załogantów nie może być większa niż 99 osób'
        }
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
        input: { name: '', length: '', crew: '' },
        expected: true
      },
      {
        name: 'name error present',
        input: { name: 'Nazwa rejsu jest wymagana', length: '', crew: '' },
        expected: false
      },
      {
        name: 'length error present',
        input: { name: '', length: 'Długość rejsu musi być większa niż 0', crew: '' },
        expected: false
      },
      {
        name: 'crew error present',
        input: { name: '', length: '', crew: 'Liczba załogantów musi być większa niż 0' },
        expected: false
      },
      {
        name: 'multiple errors present',
        input: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu musi być większa niż 0',
          crew: 'Liczba załogantów musi być większa niż 0'
        },
        expected: false
      }
    ];

    theories('should determine if form is valid | {name}', validityTheories, (theory) => {
      const result = isCruiseFormValid(theory.input);
      expect(result).toBe(theory.expected);
    });
  });
});
