'use server';
/**
 * @fileOverview Un generador de landing pages impulsado por Inteligencia Artificial (GPT/Gemini).
 * Crea estructuras de venta persuasivas basadas en los detalles técnicos de un producto.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWebsiteInputSchema = z.object({
  productName: z.string().describe('El nombre del producto.'),
  description: z.string().describe('Descripción base o técnica del producto.'),
  affiliateName: z.string().describe('Nombre del socio embajador que promociona.'),
});
export type GenerateWebsiteInput = z.infer<typeof GenerateWebsiteInputSchema>;

const WebsiteSectionSchema = z.object({
  title: z.string().describe('Título persuasivo de la sección.'),
  content: z.string().describe('Cuerpo de texto con copywriting de alta conversión.'),
});

const GenerateWebsiteOutputSchema = z.object({
  hero: z.object({
    headline: z.string().describe('Titular magnético de 40 a 70 caracteres.'),
    subheadline: z.string().describe('Explicación clara de la transformación del cliente.'),
    ctaText: z.string().describe('Texto directo para el botón de compra.'),
  }),
  sections: z.array(WebsiteSectionSchema).describe('Mínimo 3 secciones: Beneficios, ¿Para quién es?, ¿Qué incluye?.'),
  footerMessage: z.string().describe('Mensaje de cierre con garantía.'),
});
export type GenerateWebsiteOutput = z.infer<typeof GenerateWebsiteOutputSchema>;

export async function generateWebsiteContent(input: GenerateWebsiteInput): Promise<GenerateWebsiteOutput> {
  return generateWebsiteFlow(input);
}

const websitePrompt = ai.definePrompt({
  name: 'generateWebsitePrompt',
  input: {schema: GenerateWebsiteInputSchema},
  output: {schema: GenerateWebsiteOutputSchema},
  prompt: `Eres un experto en Copywriting, Neuromarketing y Psicología de Ventas. Tu misión es utilizar tu "motor GPT" para crear el contenido de una Landing Page ganadora.

PRODUCTO: {{{productName}}}
CONTEXTO TÉCNICO: {{{description}}}
EMBAJADOR: {{{affiliateName}}}

ESTRUCTURA REQUERIDA:
1. Headline (H1): Usa la fórmula "Beneficio + Tiempo" o "Deseo + Curiosidad". Evita frases genéricas.
2. Subheadline (H2): Debe responder a "¿Qué gano yo?" de forma emocional.
3. Secciones:
   - Beneficios Irresistibles: No hables de características, habla de resultados.
   - ¿Para quién es esto?: Identifica el "dolor" del cliente ideal.
   - El Factor Sync: Por qué este producto es diferente a la competencia.

INSTRUCCIONES DE TONO:
- Español Latino neutro.
- Directo, sin rellenos.
- Enfocado 100% en la CONVERSIÓN.

IMPORTANTE: Los textos deben ser listos para publicar. No uses placeholders.`,
});

const generateWebsiteFlow = ai.defineFlow(
  {
    name: 'generateWebsiteFlow',
    inputSchema: GenerateWebsiteInputSchema,
    outputSchema: GenerateWebsiteOutputSchema,
  },
  async input => {
    const {output} = await websitePrompt(input);
    return output!;
  }
);
