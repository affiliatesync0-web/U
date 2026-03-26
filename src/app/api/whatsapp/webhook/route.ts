
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow';

/**
 * Webhook para recibir mensajes de WhatsApp.
 * Este endpoint procesa los mensajes entrantes, identifica al afiliado y responde con IA.
 * Nota: El formato del JSON entrante depende del proveedor (Twilio, Meta, etc.).
 * Se asume un formato estándar { from: string, message: string }.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { from, message } = body;

    if (!from || !message) {
      return NextResponse.json({ error: 'Formato de mensaje inválido' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    
    // 1. Buscar al afiliado por su número de WhatsApp (limpiando caracteres no numéricos)
    const cleanNumber = from.replace(/\D/g, '');
    const affiliatesRef = collection(firestore, 'affiliates');
    const q = query(affiliatesRef, 
      where('whatsappNumber', '==', cleanNumber), 
      where('botEnabled', '==', true)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ 
        error: 'Afiliado no encontrado o bot desactivado para este número',
        receivedNumber: cleanNumber 
      }, { status: 404 });
    }

    const affiliateDoc = querySnapshot.docs[0];
    const affiliate = affiliateDoc.data();

    // 2. Obtener el catálogo de productos para el contexto de la IA
    const productsRef = collection(firestore, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const catalog = productsSnapshot.docs.map(doc => ({
      name: doc.data().name,
      price: doc.data().price,
      code: doc.data().code,
      description: doc.data().description
    }));

    // 3. Procesar el mensaje con el flujo de Genkit
    const aiResponse = await processBotMessage({
      userMessage: message,
      affiliateName: affiliate.firstName || 'Asistente',
      welcomeMessage: affiliate.botWelcomeMessage || '¡Hola! ¿En qué puedo ayudarte?',
      catalog: catalog,
      history: [] // Se podría implementar persistencia de historial en Firestore más adelante
    });

    // 4. Retornar la respuesta (el proveedor de WhatsApp enviará esto al cliente)
    return NextResponse.json({ 
      success: true,
      reply: aiResponse.reply,
      affiliateId: affiliateDoc.id
    });

  } catch (error: any) {
    console.error('Error en Webhook de WhatsApp:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
