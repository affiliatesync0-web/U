import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * Webhook para la API oficial de WhatsApp Business
 * Detecta al afiliado, su producto objetivo y usa la IA para cerrar la venta.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 404 });
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message || !message.text) {
      return NextResponse.json({ status: 'No message content' });
    }

    const from = message.from;
    const text = message.text.body;
    const displayPhoneNumber = value.metadata.display_phone_number;

    const { firestore } = initializeFirebase();
    
    // 1. Buscar afiliado por el número de WhatsApp receptor
    const affiliatesRef = collection(firestore, 'affiliates');
    const q = query(affiliatesRef, 
      where('whatsappNumber', '==', displayPhoneNumber), 
      where('botEnabled', '==', true)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Affiliate not found or bot disabled' });
    }

    const affiliate = querySnapshot.docs[0].data();
    const targetProductId = affiliate.targetProductId;

    if (!targetProductId) {
      return NextResponse.json({ error: 'No target product selected for this bot' });
    }

    // 2. Obtener los detalles del producto objetivo que el afiliado eligió
    const productSnap = await getDoc(doc(firestore, 'products', targetProductId));
    if (!productSnap.exists()) {
      return NextResponse.json({ error: 'Selected product not found' });
    }

    const p = productSnap.data();
    const targetProduct = {
      name: p.name,
      price: p.price,
      code: p.code,
      description: p.description,
      bankName: p.payoutBankId || 'Consultar',
      accountNumber: p.payoutBankAccountNumber || 'Consultar',
      accountHolder: p.payoutBankAccountHolderName || 'Administrador'
    };

    // 3. Procesar con Genkit (IA Especializada en ese producto)
    const aiResponse = await processBotMessage({
      userMessage: text,
      affiliateName: affiliate.firstName || 'Asistente',
      welcomeMessage: affiliate.botWelcomeMessage || 'Hola, ¿cómo puedo ayudarte?',
      targetProduct: targetProduct,
      history: [] // Se podría implementar memoria aquí
    });

    // 4. Enviar respuesta real
    await sendWhatsAppMessage(from, aiResponse.reply);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('WEBHOOK ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  
  return new Response('Forbidden', { status: 403 });
}
