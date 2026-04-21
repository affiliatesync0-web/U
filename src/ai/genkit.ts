import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Sync Connect Core Intelligence
 * Configuración compatible con Genkit v1.x.
 * Se utiliza Gemini 1.5 Flash para garantizar la máxima velocidad.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash',
});
