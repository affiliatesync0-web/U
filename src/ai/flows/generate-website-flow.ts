'use server';
/**
 * @fileOverview Un generador de landing pages impulsado por IA.
 * Crea estructuras de venta persuasivas basadas en los detalles de un producto.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWebsiteInputSchema = z.object({
  productName: z.string().describe('El nombre del producto.'),
  description: z.string().describe('Descripción base del producto.'),
  affiliateName: z.string().describe('Nombre del socio que promociona.'),
});
export type GenerateWebsiteInput = z.infer<typeof GenerateWebsiteInputSchema>;

const WebsiteSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const GenerateWebsiteOutputSchema = z.object({
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string(),
  }),
  sections: z.array(WebsiteSectionSchema).describe('Secciones de beneficios, testimonios o características.'),
  footerMessage: z.string(),
});
export type GenerateWebsiteOutput = z.infer<typeof GenerateWebsiteOutputSchema>;

export async function generateWebsiteContent(input: GenerateWebsiteInput): Promise<GenerateWebsiteOutput> {
  return generateWebsiteFlow(input);
}

const websitePrompt = ai.definePrompt({
  name: 'generateWebsitePrompt',
  input: {schema: GenerateWebsiteInputSchema},
  output: {schema: GenerateWebsiteOutputSchema},
  prompt: `Eres un experto en Copywriting y Diseño de Conversión (CRO). 
Tu misión es crear el contenido para una Landing Page de alto impacto para el producto: {{{productName}}}.

CONTEXTO:
- Producto: {{{productName}}}
- Descripción base: {{{description}}}
- Promocionado por: {{{affiliateName}}}

INSTRUCCIONES:
1. Crea un titular (Headline) magnético que use un beneficio emocional fuerte.
2. Crea un sub-titular que explique la transformación que el cliente obtendrá.
3. Define al menos 3 secciones de contenido (Beneficios, ¿Para quién es?, ¿Qué aprenderás?).
4. El tono debe ser profesional, persuasivo y cercano.
5. Usa español de América Latina neutro.

IMPORTANTE: El CTA debe ser corto y directo (ej: "SÍ, QUIERO ACCESO AHORA").`,
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
