import { CrewMember } from '../model/crew'

export interface CruiseFormData {
  name: string;
  length: number;
  crewMembers: CrewMember[];
  startDate?: string;
}

export interface CruiseFormErrors {
  name: string;
  length: string;
  crewMembers: string;
  startDate: string;
}

export interface SupplyValidationErrors {
  name: string;
  unit: string;
  category: string;
  isVegetarian: string;
  isVegan: string;
  general: string;
}
