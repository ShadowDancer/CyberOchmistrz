import { validateCruiseForm, isCruiseFormValid } from '../src/model/cruiseData';
import { CrewMember } from '../src/types';
import theories from 'jest-theories';

const makeCrewMembers = (count: number): CrewMember[] =>
  Array.from({ length: count }, (_, i) => ({ id: `m-${i}`, tags: ['omnivore'] }));

describe('Cruise Form Validation', () => {
  describe('validateCruiseForm', () => {
    const validationTheories = [
      {
        name: 'valid form data',
        input: { name: 'Test Cruise', length: 5, crewMembers: makeCrewMembers(4) },
        expected: { name: '', length: '', crewMembers: '', startDate: '' }
      },
      {
        name: 'empty name',
        input: { name: '', length: 5, crewMembers: makeCrewMembers(4), startDate: '' },
        expected: { name: 'Nazwa rejsu jest wymagana', length: '', crewMembers: '', startDate: '' }
      },
      {
        name: 'whitespace-only name',
        input: { name: '   ', length: 5, crewMembers: makeCrewMembers(4), startDate: '' },
        expected: { name: 'Nazwa rejsu jest wymagana', length: '', crewMembers: '', startDate: '' }
      },
      {
        name: 'length less than 1',
        input: { name: 'Test Cruise', length: 0, crewMembers: makeCrewMembers(4), startDate: '' },
        expected: { name: '', length: 'Długość rejsu musi być większa niż 0', crewMembers: '', startDate: '' }
      },
      {
        name: 'negative length',
        input: { name: 'Test Cruise', length: -1, crewMembers: makeCrewMembers(4), startDate: '' },
        expected: { name: '', length: 'Długość rejsu musi być większa niż 0', crewMembers: '', startDate: '' }
      },
      {
        name: 'length equal to 100',
        input: { name: 'Test Cruise', length: 100, crewMembers: makeCrewMembers(4), startDate: '' },
        expected: { name: '', length: 'Długość rejsu nie może być większa niż 99 dni', crewMembers: '', startDate: '' }
      },
      {
        name: 'length greater than 100',
        input: { name: 'Test Cruise', length: 101, crewMembers: makeCrewMembers(4), startDate: '' },
        expected: { name: '', length: 'Długość rejsu nie może być większa niż 99 dni', crewMembers: '', startDate: '' }
      },
      {
        name: 'empty crewMembers',
        input: { name: 'Test Cruise', length: 5, crewMembers: [], startDate: '' },
        expected: { name: '', length: '', crewMembers: 'Liczba załogantów musi być większa niż 0', startDate: '' }
      },
      {
        name: 'crewMembers equal to 100',
        input: { name: 'Test Cruise', length: 5, crewMembers: makeCrewMembers(100), startDate: '' },
        expected: { name: '', length: '', crewMembers: 'Liczba załogantów nie może być większa niż 99 osób', startDate: '' }
      },
      {
        name: 'crewMembers greater than 100',
        input: { name: 'Test Cruise', length: 5, crewMembers: makeCrewMembers(101), startDate: '' },
        expected: { name: '', length: '', crewMembers: 'Liczba załogantów nie może być większa niż 99 osób', startDate: '' }
      },
      {
        name: 'multiple validation errors',
        input: { name: '', length: 0, crewMembers: [], startDate: '' },
        expected: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu musi być większa niż 0',
          crewMembers: 'Liczba załogantów musi być większa niż 0',
          startDate: ''
        }
      },
      {
        name: 'all fields invalid',
        input: { name: '', length: 150, crewMembers: makeCrewMembers(150), startDate: '' },
        expected: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu nie może być większa niż 99 dni',
          crewMembers: 'Liczba załogantów nie może być większa niż 99 osób',
          startDate: ''
        }
      },
      {
        name: 'invalid start date',
        input: { name: 'Test Cruise', length: 5, crewMembers: makeCrewMembers(4), startDate: 'invalid-date' },
        expected: { name: '', length: '', crewMembers: '', startDate: 'Nieprawidłowa data rozpoczęcia' }
      },
      {
        name: 'valid start date',
        input: { name: 'Test Cruise', length: 5, crewMembers: makeCrewMembers(4), startDate: '2025-10-15' },
        expected: { name: '', length: '', crewMembers: '', startDate: '' }
      },
      {
        name: 'anonymous omnivore crew member is valid',
        input: { name: 'Test Cruise', length: 5, crewMembers: [{ id: 'm1', tags: ['omnivore'] }] },
        expected: { name: '', length: '', crewMembers: '', startDate: '' }
      },
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
        input: { name: '', length: '', crewMembers: '', startDate: '' },
        expected: true
      },
      {
        name: 'name error present',
        input: { name: 'Nazwa rejsu jest wymagana', length: '', crewMembers: '', startDate: '' },
        expected: false
      },
      {
        name: 'length error present',
        input: { name: '', length: 'Długość rejsu musi być większa niż 0', crewMembers: '', startDate: '' },
        expected: false
      },
      {
        name: 'crewMembers error present',
        input: { name: '', length: '', crewMembers: 'Liczba załogantów musi być większa niż 0', startDate: '' },
        expected: false
      },
      {
        name: 'multiple errors present',
        input: {
          name: 'Nazwa rejsu jest wymagana',
          length: 'Długość rejsu musi być większa niż 0',
          crewMembers: 'Liczba załogantów musi być większa niż 0',
          startDate: ''
        },
        expected: false
      },
      {
        name: 'startDate error present',
        input: { name: '', length: '', crewMembers: '', startDate: 'Nieprawidłowa data rozpoczęcia' },
        expected: false
      }
    ];

    theories('should determine if form is valid | {name}', validityTheories, (theory) => {
      const result = isCruiseFormValid(theory.input);
      expect(result).toBe(theory.expected);
    });
  });
});
