import { useState, useEffect } from 'react';

const moneyKeys = [
  'amount',
  'balance',
  'overdraftLimit',
  'totalLimit',
  'usedLimit',
  'originalAmount',
  'offerAmount',
  'monthlyInstallment',
  'baseAllocated'
];

const parseLocalizedMoney = (value) => {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value === 'number') return value;

  const stringValue = String(value).trim().replace(/\s+/g, '');
  if (!stringValue) return value;

  const normalized = stringValue.includes(',') && stringValue.includes('.')
    ? stringValue.replace(/\./g, '').replace(',', '.')
    : stringValue.replace(',', '.');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : value;
};

const normalizeStoredValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeStoredValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        if (moneyKeys.includes(key)) {
          return [key, parseLocalizedMoney(entryValue)];
        }
        return [key, normalizeStoredValue(entryValue)];
      })
    );
  }

  return value;
};

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      return normalizeStoredValue(parsed);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
