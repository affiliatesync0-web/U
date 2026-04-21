import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit compatible con v1.x.
 * Se habilitan los plugins de Google AI (Gemini) y OpenAI (GPT).
 * Se utiliza Gemini 1.5 Flash como motor predeterminado por su velocidad y eficiencia.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI()
  ],
  model: 'googleai/gemini-1.5-flash', 
});
