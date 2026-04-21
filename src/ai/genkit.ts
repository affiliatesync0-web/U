import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit con soporte para OpenAI (GPT) y Google AI (Gemini).
 * Se establece GPT-4o como el modelo predeterminado para el generador de sitios web.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
    }),
    openAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  ],
  model: 'openai/gpt-4o', // Modelo maestro para copywriting de alta conversión
});
