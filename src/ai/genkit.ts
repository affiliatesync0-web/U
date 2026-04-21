import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración maestra de Genkit compatible con v1.x.
 * Se utiliza el plugin de OpenAI para habilitar GPT-4o como motor de élite.
 * Los plugins se llaman sin argumentos para que usen las variables de entorno estándar.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI()
  ],
  model: 'openai/gpt-4o', 
});
