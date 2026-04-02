'use server';
/**
 * @fileOverview Un agente de ventas inteligente para el bot de WhatsApp.
 * Optimizado para el cierre de ventas automático proporcionando datos bancarios.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductInfoSchema = z.object({
  name: z.string(),
  price: z.number(),
  code: z.string(),
  description: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
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
  prompt: `Eres un cerrador de ventas experto para Sync Connect. Atiendes en el WhatsApp de {{{affiliateName}}}.

OBJETIVO: Vender los productos del catálogo de forma automática.

CONTEXTO DEL AFILIADO:
- Mensaje de Bienvenida: {{{welcomeMessage}}}

CATÁLOGO E INSTRUCCIONES DE PAGO:
{{#each catalog}}
- PRODUCTO: {{{name}}} (Código: {{{code}}})
- PRECIO: \${{{price}}}
- DESCRIPCIÓN: {{{description}}}
- DATOS PARA EL DEPÓSITO: Banco: {{{bankName}}}, Cuenta: {{{accountNumber}}}, Titular: {{{accountHolder}}}
-------------------
{{/each}}

INSTRUCCIONES DE VENTA AUTOMÁTICA:
1. Si el usuario pregunta por un producto, descríbelo con entusiasmo.
2. SI EL USUARIO MUESTRA INTERÉS EN COMPRAR O PREGUNTA CÓMO PAGAR: 
   - Dale el precio exacto.
   - Proporciónale LOS DATOS BANCARIOS exactos que aparecen en el catálogo para ese producto.
   - Dile que debe enviarte una foto del voucher o número de referencia por este medio una vez realizado el pago para activar su acceso.
3. Mantén las respuestas cortas y usa emojis (💰, ✅, 🚀).
4. No inventes datos bancarios. Usa solo los que están en el catálogo.
5. Si el usuario envía un código de producto (ej: "MARKETING-01"), asume que quiere comprarlo y dale los datos de pago de inmediato.

MENSAJE ACTUAL DEL USUARIO:
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
