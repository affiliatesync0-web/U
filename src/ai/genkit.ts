
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuración maestra de Genkit v1.x.
 * Se utiliza exclusivamente Gemini 1.5 Flash para garantizar velocidad y bajo costo.
 * Los plugins se inicializan sin argumentos para usar las variables de entorno estándar.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash', 
});
