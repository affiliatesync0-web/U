'use server';
/**
 * @fileOverview Un agente de ventas inteligente para el bot de WhatsApp.
 * Optimizado para el cierre de ventas de un producto específico seleccionado.
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
  targetProduct: ProductInfoSchema.describe('El producto específico que el afiliado eligió vender.'),
  welcomeMessage: z.string().describe('El mensaje de bienvenida configurado.'),
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
  prompt: `Eres el Bot de Ventas oficial de {{{affiliateName}}} en Sync Connect.
Tu misión es CERRAR LA VENTA del producto: {{{targetProduct.name}}}.

DETALLES DEL PRODUCTO OBJETIVO:
- Nombre: {{{targetProduct.name}}}
- Código: {{{targetProduct.code}}}
- Precio: ${{{targetProduct.price}}}
- Descripción: {{{targetProduct.description}}}

DATOS BANCARIOS PARA EL PAGO (SOLO ENTREGAR CUANDO EL CLIENTE ESTÉ LISTO):
- Banco: {{{targetProduct.bankName}}}
- Cuenta: {{{targetProduct.accountNumber}}}
- Titular: {{{targetProduct.accountHolder}}}

INSTRUCCIONES DE VENTA:
1. Sé extremadamente persuasivo y amable. Usa emojis (🚀, ✅, 💰).
2. Si el cliente tiene dudas, explica los beneficios de este producto específico.
3. Si el cliente pregunta cómo comprar o muestra interés claro:
   - Confirma el precio de ${{{targetProduct.price}}}.
   - Dale los DATOS BANCARIOS arriba mencionados de forma clara.
   - Pídele que envíe el comprobante por este medio para activar su acceso.
4. Mantén el foco SIEMPRE en este producto. Si pregunta por otros, dile que este es la mejor solución ahora mismo.
5. Usa el mensaje de bienvenida: "{{{welcomeMessage}}}" como base de tu personalidad.

MENSAJE DEL CLIENTE:
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
