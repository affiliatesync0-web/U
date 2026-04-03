
'use server';
/**
 * @fileOverview Un Asistente de Ventas IA (Cerrador Experto).
 * Optimizado para generar scripts de alta conversión y manejar objeciones técnicas.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductInfoSchema = z.object({
  name: z.string(),
  price: z.number(),
  code: z.string(),
  description: z.string().optional(),
});

const SalesAssistantInputSchema = z.object({
  userMessage: z.string().describe('La consulta del afiliado o mensaje a analizar.'),
  affiliateName: z.string().describe('Nombre del afiliado que solicita la ayuda.'),
  catalog: z.array(ProductInfoSchema).describe('Catálogo de productos cargado en tiempo real.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
});
export type SalesAssistantInput = z.infer<typeof SalesAssistantInputSchema>;

const SalesAssistantOutputSchema = z.object({
  reply: z.string().describe('La respuesta estratégica del mentor de ventas.'),
});
export type SalesAssistantOutput = z.infer<typeof SalesAssistantOutputSchema>;

export async function processAssistantMessage(input: SalesAssistantInput): Promise<SalesAssistantOutput> {
  return salesAssistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'salesAssistantExpertPrompt',
  input: {schema: SalesAssistantInputSchema},
  output: {schema: SalesAssistantOutputSchema},
  prompt: `Eres el "Director de Ventas de Sync Connect". Tu única misión es que el afiliado {{{affiliateName}}} CIERRE LA VENTA hoy mismo.

CONTEXTO DEL CATÁLOGO (Usa estos datos exactos):
{{#each catalog}}
- PRODUCTO: {{{name}}} | Código: {{{code}}} | Precio: \${{{price}}}
  Características: {{{description}}}
-------------------
{{/each}}

TU COMPORTAMIENTO:
1. Analiza la intención del mensaje. Si es sobre un producto específico, destaca sus beneficios ÚNICOS.
2. Si el afiliado pide un script para WhatsApp, dale un bloque de texto LISTO PARA COPIAR.
3. Usa psicología de ventas: Escasez, Urgencia, Reciprocidad y Autoridad.
4. Mantén las respuestas profesionales pero con energía ganadora.
5. SIEMPRE incluye una pregunta de cierre al final del script sugerido (ej: "¿Te parece bien si te envío los datos para el depósito ahora mismo?").

CONSULTA ACTUAL:
{{{userMessage}}}`,
});

const salesAssistantFlow = ai.defineFlow(
  {
    name: 'salesAssistantFlow',
    inputSchema: SalesAssistantInputSchema,
    outputSchema: SalesAssistantOutputSchema,
  },
  async input => {
    const {output} = await assistantPrompt(input);
    return output!;
  }
);
