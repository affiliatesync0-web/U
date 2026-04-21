
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit con soporte para OpenAI (ChatGPT) y Google AI (Gemini).
 * Se establece GPT-4o como el motor de élite para el Site Builder y copywriting.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY
    }),
    openAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  ],
  model: 'openai/gpt-4o', 
});
