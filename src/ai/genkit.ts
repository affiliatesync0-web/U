import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Sync Connect Core Intelligence
 * Configuración maestra para el motor de IA de la plataforma.
 * Se utiliza Gemini 1.5 Flash para garantizar la máxima velocidad en Nicaragua.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash',
});
