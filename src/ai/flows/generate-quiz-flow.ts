'use server';
/**
 * @fileOverview Generador de exámenes impulsado por IA para la Sync Academy.
 * Crea preguntas de opción múltiple basadas en el contexto de un módulo educativo.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  moduleTitle: z.string().describe('El título del módulo de capacitación.'),
  moduleDescription: z.string().describe('Descripción o temas que trata el módulo.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  text: z.string().describe('El enunciado de la pregunta.'),
  options: z.array(z.string()).length(3).describe('Tres opciones de respuesta.'),
  correctIndex: z.number().min(0).max(2).describe('El índice (0, 1 o 2) de la respuesta correcta.'),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).min(3).max(5).describe('Un set de 3 a 5 preguntas para el examen.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateModuleQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  const {output} = await quizPrompt(input);
  if (!output) throw new Error("No se pudo generar el examen.");
  return output;
}

const quizPrompt = ai.definePrompt({
  name: 'generateModuleQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `Eres un experto en pedagogía y formación corporativa de Sync Connect. 
Tu misión es crear un examen de certificación para el siguiente módulo:

TÍTULO: {{{moduleTitle}}}
CONTENIDO: {{{moduleDescription}}}

INSTRUCCIONES:
1. Genera exactamente 4 preguntas de opción múltiple.
2. Cada pregunta debe tener exactamente 3 opciones.
3. Asegúrate de que las preguntas validen el conocimiento real sobre el tema.
4. El tono debe ser profesional y motivador.
5. Indica claramente cuál es la respuesta correcta mediante el índice.

Genera el resultado en formato JSON puro.`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    return generateModuleQuiz(input);
  }
);
