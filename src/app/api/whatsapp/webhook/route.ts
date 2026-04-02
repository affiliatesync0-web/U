import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow';

/**
 * Webhook universal para recibir mensajes de WhatsApp.
 * Ahora incluye los datos bancarios de los productos para permitir la venta automática.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type');
    let body: any;

    if (contentType?.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    const from = body.From || body.from || body.sender || (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from);
    const message = body.Body || body.message || body.text || (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body);

    if (!from || !message) {
      return NextResponse.json({ error: 'Formato de mensaje no reconocido' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const cleanNumber = from.toString().replace(/\D/g, '');
    
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

    // Obtener catálogo con datos de pago para que la IA pueda "vender sola"
    const productsRef = collection(firestore, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const catalog = productsSnapshot.docs.map(doc => {
      const p = doc.data();
      return {
        name: p.name,
        price: p.price,
        code: p.code,
        description: p.description,
        bankName: p.payoutBankId || 'Consultar',
        accountNumber: p.payoutBankAccountNumber || 'Consultar',
        accountHolder: p.payoutBankAccountHolderName || 'Administrador'
      };
    });

    const aiResponse = await processBotMessage({
      userMessage: message.toString(),
      affiliateName: affiliate.firstName || 'Asistente Sync Connect',
      welcomeMessage: affiliate.botWelcomeMessage || '¡Hola! ¿En qué puedo ayudarte?',
      catalog: catalog,
      history: []
    });

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
