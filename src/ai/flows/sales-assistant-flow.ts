'use server';
/**
 * @fileOverview Un Asistente de Ventas IA (Coach) para el afiliado.
 * Ayuda al afiliado a crear cierres de ventas, manejar objeciones y generar copy.
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
  userMessage: z.string().describe('La consulta del afiliado.'),
  affiliateName: z.string().describe('Nombre del afiliado.'),
  catalog: z.array(ProductInfoSchema).describe('Productos que el afiliado puede vender.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
});
export type SalesAssistantInput = z.infer<typeof SalesAssistantInputSchema>;

const SalesAssistantOutputSchema = z.object({
  reply: z.string().describe('La respuesta del coach de ventas.'),
});
export type SalesAssistantOutput = z.infer<typeof SalesAssistantOutputSchema>;

export async function processAssistantMessage(input: SalesAssistantInput): Promise<SalesAssistantOutput> {
  return salesAssistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'salesAssistantPrompt',
  input: {schema: SalesAssistantInputSchema},
  output: {schema: SalesAssistantOutputSchema},
  prompt: `Eres el "Copiloto de Ventas de Sync Connect". Tu misión es ayudar al afiliado {{{affiliateName}}} a CERRAR VENTAS reales.

TU ROL:
- Eres un mentor experto en ventas por WhatsApp y cierre de ventas de infoproductos.
- Ayudas al afiliado a redactar mensajes persuasivos.
- Ayudas a manejar objeciones difíciles (ej: "está muy caro", "lo voy a pensar", "es una estafa").
- Sugieres estrategias basadas en el catálogo disponible.

CONTEXTO DEL CATÁLOGO:
{{#each catalog}}
- PRODUCTO: {{{name}}} (Código: {{{code}}}) - Precio: \${{{price}}}
  Descripción: {{{description}}}
-------------------
{{/each}}

REGLAS DE RESPUESTA:
1. Sé motivador y profesional.
2. Proporciona "Scripts de WhatsApp" listos para copiar y pegar.
3. Usa técnicas de escasez y urgencia cuando sea apropiado.
4. Si el afiliado pregunta algo que no es de ventas, recuérdale con humor que tu especialidad es el dinero y las ventas.

CONSULTA DEL AFILIADO:
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
