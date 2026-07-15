/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const client = new GoogleGenerativeAI({ apiKey });

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY no configurada. Algunas características de IA estarán deshabilitadas.');
}

/**
 * Interfaz para respuestas de análisis de contenido
 */
export interface ContentAnalysisResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Servicio de integración con Gemini API
 */
export const GeminiService = {
  /**
   * Verifica si el servicio está disponible
   */
  isAvailable: (): boolean => !!apiKey,

  /**
   * Genera biografía de artista usando IA
   */
  generateArtistBio: async (artistName: string, genre: string, highlights?: string[]): Promise<ContentAnalysisResult> => {
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API no configurada',
      };
    }

    try {
      const prompt = `Genera una biografía profesional para un artista musical con los siguientes detalles:
        Nombre: ${artistName}
        Género: ${genre}
        ${highlights ? `Puntos destacados: ${highlights.join(', ')}` : ''}
        
        La biografía debe ser concisa, profesional y adecuada para medios de prensa. Máximo 150 palabras.`;

      const model = client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      return {
        success: true,
        content: response.text(),
      };
    } catch (error) {
      console.error('Error generando bio de artista:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Analiza feedback de evento y genera recomendaciones
   */
  analyzeEventFeedback: async (feedback: string): Promise<ContentAnalysisResult> => {
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API no configurada',
      };
    }

    try {
      const prompt = `Analiza el siguiente feedback de un evento musical y genera 3 recomendaciones clave para mejorar futuros shows:
        
        Feedback: ${feedback}
        
        Proporciona recomendaciones prácticas y específicas.`;

      const model = client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      return {
        success: true,
        content: response.text(),
      };
    } catch (error) {
      console.error('Error analizando feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Genera estrategia de marketing para artista
   */
  generateMarketingStrategy: async (artistName: string, targetAudience: string): Promise<ContentAnalysisResult> => {
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API no configurada',
      };
    }

    try {
      const prompt = `Crea una estrategia de marketing digital para el artista ${artistName} dirigida a ${targetAudience}.
        
        Incluye:
        1. Estrategia de redes sociales
        2. Canales recomendados
        3. Tipos de contenido
        4. Frecuencia de publicación
        
        Sé específico y práctico.`;

      const model = client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      return {
        success: true,
        content: response.text(),
      };
    } catch (error) {
      console.error('Error generando estrategia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
};
