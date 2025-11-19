
import { User, LabRecord, UserRole } from '../types';

// Keys for LocalStorage
const USERS_KEY = 'aqualims_users';
const RECORDS_KEY = 'aqualims_records';

// Seed initial data if empty
const seedData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const adminUser: User = {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@aqualims.com',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash: 'password123', // Simplified for demo
      createdAt: new Date().toISOString()
    };
    const normalUser: User = {
      id: 'user-1',
      username: 'tech1',
      email: 'tech1@aqualims.com',
      role: UserRole.USER,
      isActive: true,
      passwordHash: 'password123',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([adminUser, normalUser]));
  }

  if (!localStorage.getItem(RECORDS_KEY)) {
    // Seed some dummy records
    const dummyRecords: LabRecord[] = [
      {
        id: 'rec-1',
        date: new Date().toISOString().split('T')[0],
        samplePoint: 'PSF Inlet',
        attribute: 'TPC 22°C',
        value: '<100',
        limit: '<100cfu/100ml',
        observation24h: 'Clear',
        observation48h: 'Clear',
        observation72h: 'Clear',
        negativeControl: 'Clear',
        remarks: 'Routine check',
        createdBy: 'tech1',
        createdById: 'user-1',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(RECORDS_KEY, JSON.stringify(dummyRecords));
  }
};

seedData();

// --- User Services ---

export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  // Update if exists, else add
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const createUser = (username: string, email: string, role: UserRole): User => {
    const newUser: User = {
        id: crypto.randomUUID(),
        username,
        email,
        role,
        isActive: true,
        passwordHash: 'password123', // Default password
        createdAt: new Date().toISOString()
    };
    saveUser(newUser);
    return newUser;
}

// --- Record Services ---

export const getRecords = (): LabRecord[] => {
  const records = localStorage.getItem(RECORDS_KEY);
  return records ? JSON.parse(records) : [];
};

export const saveRecord = (record: LabRecord): void => {
  const records = getRecords();
  const index = records.findIndex(r => r.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const createRecord = (data: Omit<LabRecord, 'id' | 'createdAt' | 'updatedAt'>): LabRecord => {
    const newRecord: LabRecord = {
        ...data,
        value: data.value || '',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    saveRecord(newRecord);
    return newRecord;
}

// --- Auth Simulation ---

export const authenticate = (emailOrUser: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => (u.email === emailOrUser || u.username === emailOrUser) && u.passwordHash === password);
  if (user && user.isActive) return user;
  return null;
};