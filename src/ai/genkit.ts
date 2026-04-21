
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit con soporte oficial para OpenAI y Google AI.
 * Se establece GPT-4o como el motor de élite para el Site Builder.
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
  model: 'openai/gpt-4o', // Motor principal para copywriting persuasivo
});
