import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow';

/**
 * Webhook universal para recibir mensajes de WhatsApp.
 * Soporta formatos comunes de proveedores (Twilio, Meta, etc.)
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type');
    let body: any;

    // Manejar diferentes tipos de contenido (JSON o Form URL Encoded)
    if (contentType?.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // Extraer datos según el proveedor (Twilio usa 'From'/'Body', Meta usa 'from'/'message')
    const from = body.From || body.from || body.sender;
    const message = body.Body || body.message || body.text;

    if (!from || !message) {
      return NextResponse.json({ error: 'Mensaje o remitente no encontrado' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    
    // Limpiar número: quitar '+', espacios y dejar solo dígitos
    const cleanNumber = from.toString().replace(/\D/g, '');
    
    // Buscar al afiliado que tiene este número configurado y el bot activo
    const affiliatesRef = collection(firestore, 'affiliates');
    const q = query(affiliatesRef, 
      where('whatsappNumber', '==', cleanNumber), 
      where('botEnabled', '==', true)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Si no se encuentra por número exacto, buscamos todos los activos para ver si hay error de formato
      return NextResponse.json({ 
        error: 'Afiliado no configurado para este número',
        debug_received_number: cleanNumber 
      }, { status: 404 });
    }

    const affiliateDoc = querySnapshot.docs[0];
    const affiliate = affiliateDoc.data();

    // Obtener catálogo actualizado
    const productsRef = collection(firestore, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const catalog = productsSnapshot.docs.map(doc => ({
      name: doc.data().name,
      price: doc.data().price,
      code: doc.data().code,
      description: doc.data().description
    }));

    // Procesar con IA
    const aiResponse = await processBotMessage({
      userMessage: message.toString(),
      affiliateName: affiliate.firstName || 'Asistente de Sync Connect',
      welcomeMessage: affiliate.botWelcomeMessage || '¡Hola! ¿En qué puedo ayudarte?',
      catalog: catalog,
      history: []
    });

    // Respuesta para el proveedor de WhatsApp
    return NextResponse.json({ 
      success: true,
      reply: aiResponse.reply,
      to: from
    });

  } catch (error: any) {
    console.error('CRITICAL: Error en Webhook de WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Error interno procesando el mensaje',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Endpoint para verificación de Webhook (requerido por algunos proveedores como Meta)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ status: 'Webhook active' });
}
