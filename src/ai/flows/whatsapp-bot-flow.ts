'use server';
/**
 * @fileOverview Un agente de ventas inteligente para el bot de WhatsApp.
 *
 * - whatsappBotFlow - Flujo que procesa mensajes de clientes y responde basándose en el catálogo.
 * - WhatsAppBotInput - Entrada que incluye el mensaje del usuario y contexto del afiliado.
 * - WhatsAppBotOutput - Respuesta generada por el bot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductInfoSchema = z.object({
  name: z.string(),
  price: z.number(),
  code: z.string(),
  description: z.string().optional(),
});

const WhatsAppBotInputSchema = z.object({
  userMessage: z.string().describe('El mensaje enviado por el cliente.'),
  affiliateName: z.string().describe('Nombre del afiliado que atiende.'),
  welcomeMessage: z.string().describe('El mensaje de bienvenida configurado.'),
  catalog: z.array(ProductInfoSchema).describe('Lista de productos disponibles.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional().describe('Historial de la conversación.'),
});
export type WhatsAppBotInput = z.infer<typeof WhatsAppBotInputSchema>;

const WhatsAppBotOutputSchema = z.object({
  reply: z.string().describe('La respuesta que el bot enviará al cliente.'),
});
export type WhatsAppBotOutput = z.infer<typeof WhatsAppBotOutputSchema>;

export async function processBotMessage(input: WhatsAppBotInput): Promise<WhatsAppBotOutput> {
  return whatsappBotFlow(input);
}

const botPrompt = ai.definePrompt({
  name: 'whatsappBotPrompt',
  input: {schema: WhatsAppBotInputSchema},
  output: {schema: WhatsAppBotOutputSchema},
  prompt: `Eres un asistente de ventas experto para la plataforma Sync Connect. Estás atendiendo en el WhatsApp de {{{affiliateName}}}.

Tu objetivo es ser amable, profesional y ayudar al cliente a comprar.

CONTEXTO DEL AFILIADO:
- Mensaje de Bienvenida: {{{welcomeMessage}}}

CATÁLOGO DE PRODUCTOS:
{{#each catalog}}
- {{{name}}} (Código: {{{code}}}): ${{{price}}}. {{{description}}}
{{/each}}

INSTRUCCIONES:
1. Si el cliente pregunta por productos, describe los que hay en el catálogo de forma entusiasta.
2. Si el cliente quiere comprar, dile que debe realizar el depósito a la cuenta bancaria (que el sistema le proporcionará) y luego enviarte el número de referencia del voucher.
3. Mantén las respuestas cortas y amigables, ideales para WhatsApp. Usa emojis ocasionalmente.
4. Si no hay productos en el catálogo, dile que pronto tendremos novedades.

MENSAJE DEL USUARIO:
{{{userMessage}}}`,
});

const whatsappBotFlow = ai.defineFlow(
  {
    name: 'whatsappBotFlow',
    inputSchema: WhatsAppBotInputSchema,
    outputSchema: WhatsAppBotOutputSchema,
  },
  async input => {
    const {output} = await botPrompt(input);
    return output!;
  }
);
