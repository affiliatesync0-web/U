
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow';

/**
 * Webhook universal para recibir mensajes de WhatsApp.
 * Optimizado para identificar al afiliado y procesar respuestas IA inmediatamente.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type');
    let body: any;

    // Manejar formatos JSON (Meta/Gupshup) y Form URL Encoded (Twilio)
    if (contentType?.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // Extraer remitente y mensaje soportando múltiples proveedores
    const from = body.From || body.from || body.sender || (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from);
    const message = body.Body || body.message || body.text || (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body);

    if (!from || !message) {
      return NextResponse.json({ error: 'Formato de mensaje no reconocido' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    
    // Limpiar número: quitar '+', espacios y dejar solo dígitos para la búsqueda
    const cleanNumber = from.toString().replace(/\D/g, '');
    
    // Buscar al afiliado con el bot activo para este número
    const affiliatesRef = collection(firestore, 'affiliates');
    const q = query(affiliatesRef, 
      where('whatsappNumber', '==', cleanNumber), 
      where('botEnabled', '==', true)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ 
        error: 'Afiliado no encontrado o bot desactivado',
        number: cleanNumber 
      }, { status: 404 });
    }

    const affiliateDoc = querySnapshot.docs[0];
    const affiliate = affiliateDoc.data();

    // Obtener catálogo de productos en tiempo real
    const productsRef = collection(firestore, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const catalog = productsSnapshot.docs.map(doc => ({
      name: doc.data().name,
      price: doc.data().price,
      code: doc.data().code,
      description: doc.data().description
    }));

    // Procesar con la Inteligencia Artificial de Sync Connect
    const aiResponse = await processBotMessage({
      userMessage: message.toString(),
      affiliateName: affiliate.firstName || 'Asistente Sync Connect',
      welcomeMessage: affiliate.botWelcomeMessage || '¡Hola! ¿En qué puedo ayudarte?',
      catalog: catalog,
      history: []
    });

    // Retornar la respuesta para que el proveedor de WhatsApp la envíe al cliente
    return NextResponse.json({ 
      success: true,
      reply: aiResponse.reply,
      recipient: from,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('CRITICAL ERROR: Webhook WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Error procesando el mensaje en el servidor',
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Verificación del Webhook (Requerido por Meta Business y otros proveedores)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token) {
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ status: 'Webhook Sync Connect activo y escuchando' });
}
