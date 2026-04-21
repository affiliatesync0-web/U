import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuración maestra de Genkit compatible con v1.x.
 * Se eliminó el plugin de OpenAI para evitar conflictos y se usa la sintaxis correcta.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash', 
});
