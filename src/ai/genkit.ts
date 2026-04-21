import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit con soporte para OpenAI (ChatGPT) y Google AI (Gemini).
 * Se establece GPT-4o como el motor de élite para el Site Builder y copywriting.
 * Los plugins se inicializan sin argumentos para que utilicen las variables de entorno estándar.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI()
  ],
  model: 'openai/gpt-4o', 
});
