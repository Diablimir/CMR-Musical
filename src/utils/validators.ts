/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Artist, Venue, Event, Provider, RecordingProject, Contact } from '@/types';

/**
 * Validador de rango numérico
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): boolean {
  if (value < min || value > max) {
    console.error(`${fieldName} debe estar entre ${min} y ${max}, recibido: ${value}`);
    return false;
  }
  return true;
}

/**
 * Validador de fecha ISO 8601
 */
export function validateISODate(dateString: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/;
  if (!iso8601Regex.test(dateString)) {
    console.error(`Fecha debe estar en formato ISO 8601, recibido: ${dateString}`);
    return false;
  }
  return !isNaN(new Date(dateString).getTime());
}

/**
 * Validador de correo electrónico
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validador de teléfono internacional básico
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validador de URL
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validador de Venue
 */
export function validateVenue(venue: Partial<Venue>): string[] {
  const errors: string[] = [];

  if (!venue.name?.trim()) errors.push('Nombre del recinto es requerido');
  if (!venue.city?.trim()) errors.push('Ciudad es requerida');
  if (!venue.state?.trim()) errors.push('Estado es requerido');
  if (!venue.country?.trim()) errors.push('País es requerido');

  if (venue.lat !== undefined && (venue.lat < -90 || venue.lat > 90)) {
    errors.push('Latitud debe estar entre -90 y 90');
  }
  if (venue.lng !== undefined && (venue.lng < -180 || venue.lng > 180)) {
    errors.push('Longitud debe estar entre -180 y 180');
  }

  if (venue.googlePlaces?.rating !== undefined) {
    if (!validateRange(venue.googlePlaces.rating, 0, 5, 'Google Rating')) {
      errors.push('Google Rating debe estar entre 0 y 5');
    }
  }

  if (venue.scores) {
    const scores = venue.scores;
    ['rentabilidad', 'responseTime', 'puntualidadPago', 'negociacion', 'produccion', 'hospitalidad'].forEach(
      (scoreKey) => {
        const scoreValue = scores[scoreKey as keyof typeof scores];
        if (scoreValue !== undefined && !validateRange(scoreValue, 0, 100, scoreKey)) {
          errors.push(`${scoreKey} debe estar entre 0 y 100`);
        }
      }
    );
  }

  if (venue.email && !validateEmail(venue.email)) {
    errors.push('Email del recinto no válido');
  }

  return errors;
}

/**
 * Validador de Artist
 */
export function validateArtist(artist: Partial<Artist>): string[] {
  const errors: string[] = [];

  if (!artist.artisticName?.trim()) errors.push('Nombre artístico es requerido');
  if (!artist.legalName?.trim()) errors.push('Nombre legal es requerido');
  if (!artist.genre?.trim()) errors.push('Género musical es requerido');
  if (!artist.city?.trim()) errors.push('Ciudad es requerida');
  if (!artist.country?.trim()) errors.push('País es requerido');

  if (artist.startDate && !validateISODate(artist.startDate)) {
    errors.push('Fecha de inicio debe estar en formato ISO 8601');
  }

  if (artist.pipeline) {
    artist.pipeline.forEach((item, idx) => {
      if (!item.name?.trim()) errors.push(`Pipeline item ${idx} requiere nombre`);
      if (!item.category) errors.push(`Pipeline item ${idx} requiere categoría`);
    });
  }

  return errors;
}

/**
 * Validador de Event
 */
export function validateEvent(event: Partial<Event>): string[] {
  const errors: string[] = [];

  if (!event.name?.trim()) errors.push('Nombre del evento es requerido');
  if (!event.artistId?.trim()) errors.push('Artist ID es requerido');
  if (!event.venueId?.trim()) errors.push('Venue ID es requerido');

  if (event.date && !validateISODate(event.date)) {
    errors.push('Fecha del evento debe estar en formato ISO 8601');
  }

  if (event.capacity !== undefined && event.capacity <= 0) {
    errors.push('Capacidad debe ser mayor a 0');
  }

  if (event.attendance !== undefined && event.capacity !== undefined) {
    if (event.attendance > event.capacity) {
      errors.push('Asistencia no puede ser mayor a la capacidad');
    }
  }

  if (event.ticketPrice !== undefined && event.ticketPrice < 0) {
    errors.push('Precio del ticket no puede ser negativo');
  }

  if (event.feedback?.pacingRating !== undefined) {
    if (!validateRange(event.feedback.pacingRating, 1, 5, 'Pacing Rating')) {
      errors.push('Pacing Rating debe estar entre 1 y 5');
    }
  }

  return errors;
}

/**
 * Validador de Provider
 */
export function validateProvider(provider: Partial<Provider>): string[] {
  const errors: string[] = [];

  if (!provider.name?.trim()) errors.push('Nombre del proveedor es requerido');
  if (!provider.category) errors.push('Categoría es requerida');
  if (!provider.contactName?.trim()) errors.push('Nombre de contacto es requerido');

  if (provider.phone && !validatePhone(provider.phone)) {
    errors.push('Teléfono no válido');
  }

  if (provider.email && !validateEmail(provider.email)) {
    errors.push('Email no válido');
  }

  if (provider.rating !== undefined) {
    if (!validateRange(provider.rating, 1, 5, 'Rating')) {
      errors.push('Rating debe estar entre 1 y 5');
    }
  }

  if (provider.costPerShow !== undefined && provider.costPerShow < 0) {
    errors.push('Costo por show no puede ser negativo');
  }

  return errors;
}

/**
 * Validador de RecordingProject
 */
export function validateRecordingProject(project: Partial<RecordingProject>): string[] {
  const errors: string[] = [];

  if (!project.title?.trim()) errors.push('Título del proyecto es requerido');
  if (!project.artistId?.trim()) errors.push('Artist ID es requerido');

  if (project.releaseDate && !validateISODate(project.releaseDate)) {
    errors.push('Fecha de lanzamiento debe estar en formato ISO 8601');
  }

  if (project.songs) {
    project.songs.forEach((song, idx) => {
      if (!song.title?.trim()) errors.push(`Canción ${idx} requiere título`);
      if (song.progress !== undefined) {
        if (!validateRange(song.progress, 0, 100, `Song ${idx} progress`)) {
          errors.push(`Progreso de canción ${idx} debe estar entre 0 y 100%`);
        }
      }
    });
  }

  if (project.costs) {
    project.costs.forEach((cost, idx) => {
      if (cost.amount < 0) {
        errors.push(`Costo ${idx} no puede ser negativo`);
      }
    });
  }

  return errors;
}

/**
 * Validador de Contact
 */
export function validateContact(contact: Partial<Contact>): string[] {
  const errors: string[] = [];

  if (!contact.name?.trim()) errors.push('Nombre de contacto es requerido');
  if (!contact.email) errors.push('Email es requerido');
  else if (!validateEmail(contact.email)) errors.push('Email no válido');

  if (contact.phone && !validatePhone(contact.phone)) {
    errors.push('Teléfono no válido');
  }

  if (!contact.role?.trim()) errors.push('Rol es requerido');

  if (!contact.linkedTo || contact.linkedTo.length === 0) {
    errors.push('Contacto debe estar vinculado a al menos una entidad');
  }

  return errors;
}

/**
 * Función genérica de validación
 */
export function validate<T>(
  data: T,
  validatorFn: (data: Partial<T>) => string[]
): { isValid: boolean; errors: string[] } {
  const errors = validatorFn(data);
  return {
    isValid: errors.length === 0,
    errors,
  };
}
