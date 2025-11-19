
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  passwordHash?: string; // In a real app, never send this to frontend. keeping here for simulation.
  createdAt: string;
}

export interface LabRecord {
  id: string;
  date: string; // YYYY-MM-DD
  samplePoint: string;
  attribute: string; // TPC, Coliform, E.coli
  value?: string;
  limit: string;
  observation24h: string;
  observation48h: string;
  observation72h: string;
  negativeControl: string;
  remarks: string;
  
  // Audit Fields
  createdBy: string; // username
  createdById: string;
  createdAt: string; // ISO timestamp
  lastModifiedBy?: string; // username
  lastModifiedAt?: string; // ISO timestamp
  adminRemark?: string; // Mandatory if admin edits
}

export const SAMPLE_POINTS = [
  'PSF Inlet',
  'PSF Outlet',
  'ACF Outlet',
  'Lead ACF Outlet',
  'Lag ACF Outlet',
  'UF Outlet'
];

export const ATTRIBUTES = [
  'TPC 22°C',
  'TPC 36°C',
  'Coliform',
  'E.coli',
  'Pseudomonas.A'
];

export const DEFAULT_LIMITS: Record<string, string> = {
  'TPC 22°C': '<100 cfu/ml',
  'TPC 36°C': '<50 cfu/ml',
  'Coliform': '<1 cfu/100ml',
  'E.coli': '<1 cfu/100ml',
  'Pseudomonas.A': 'Absent/100ml'
};