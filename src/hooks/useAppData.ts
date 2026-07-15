/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Venue, Artist, Event, Tour, Contact, Provider, RecordingProject, Contract, UserAccount, FilterState } from '@/types';

/**
 * Hook personalizado para persistencia en localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error leyendo localStorage[${key}]:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error escribiendo localStorage[${key}]:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Hook personalizado para gestión de datos CRUD
 */
export function useCRUD<T extends { id: string }>(initialData: T[], key: string) {
  const [data, setData] = useLocalStorage<T[]>(key, initialData);

  const add = useCallback((item: T) => {
    setData((prev) => [item, ...prev]);
  }, [setData]);

  const update = useCallback((id: string, updates: Partial<T>) => {
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, [setData]);

  const softDelete = useCallback((id: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, deleted_at: new Date().toISOString() }
          : item
      )
    );
  }, [setData]);

  const hardDelete = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  }, [setData]);

  const getActive = useCallback(() => {
    return data.filter((item: any) => !item.deleted_at);
  }, [data]);

  return { data, add, update, softDelete, hardDelete, getActive };
}

/**
 * Hook personalizado para filtrado de eventos
 */
export function useEventFiltering(events: Event[], venues: Venue[], filters: FilterState) {
  return events.filter((evt) => {
    if (evt.deleted_at) return false;

    if (filters.artistId && evt.artistId !== filters.artistId) return false;
    if (filters.venueId && evt.venueId !== filters.venueId) return false;
    if (filters.tourId && evt.tourId !== filters.tourId) return false;
    if (filters.status && evt.status !== filters.status) return false;

    if (filters.year && !evt.date.startsWith(filters.year)) return false;

    if (filters.month) {
      const monthPart = evt.date.substring(5, 7);
      if (monthPart !== filters.month) return false;
    }

    if (filters.quarter) {
      const monthPart = Number(evt.date.substring(5, 7));
      const quarterRanges: Record<string, [number, number]> = {
        'Q1': [1, 3],
        'Q2': [4, 6],
        'Q3': [7, 9],
        'Q4': [10, 12],
      };
      const [minMonth, maxMonth] = quarterRanges[filters.quarter] || [0, 0];
      if (monthPart < minMonth || monthPart > maxMonth) return false;
    }

    if (filters.dateRangeStart && evt.date < filters.dateRangeStart) return false;
    if (filters.dateRangeEnd && evt.date > filters.dateRangeEnd) return false;

    const associatedVenue = venues.find((v) => v.id === evt.venueId);
    if (filters.city && associatedVenue?.city !== filters.city) return false;
    if (filters.state && associatedVenue?.state !== filters.state) return false;

    return true;
  });
}

/**
 * Hook personalizado para cálculo de KPIs
 */
export function useEventKPIs(events: Event[]) {
  return {
    totalCompleted: events.filter((e) => e.status === 'Completed'),
    totalRevenue: events
      .filter((e) => e.status === 'Completed')
      .reduce((acc, curr) => acc + curr.totalIncome, 0),
    totalExpenses: events
      .filter((e) => e.status === 'Completed')
      .reduce((acc, curr) => acc + curr.expenses, 0),
    avgAttendance: (() => {
      const completed = events.filter((e) => e.status === 'Completed');
      return completed.length > 0
        ? Math.round(completed.reduce((acc, curr) => acc + curr.attendance, 0) / completed.length)
        : 0;
    })(),
  };
}

/**
 * Hook personalizado para búsqueda con debounce
 */
export function useSearch<T>(items: T[], searchFn: (item: T, query: string) => boolean, debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>(items);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setResults(items.filter((item) => searchFn(item, query)));
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [query, items, searchFn, debounceMs]);

  return { query, setQuery, results };
}
