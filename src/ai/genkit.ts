import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit compatible con v1.x.
 * Se utilizan las variables de entorno estándar para las claves de API:
 * - GOOGLE_GENAI_API_KEY (para Gemini)
 * - OPENAI_API_KEY (para GPT-4o)
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI()
  ],
  model: 'googleai/gemini-1.5-flash', 
});
