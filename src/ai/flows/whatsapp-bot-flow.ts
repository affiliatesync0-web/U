
'use server';
/**
 * @fileOverview FLUJO DESACTIVADO.
 */
import { z } from 'genkit';

export async function processBotMessage(input: any): Promise<any> {
  return { reply: "El asistente automático de WhatsApp ha sido desactivado." };
}
