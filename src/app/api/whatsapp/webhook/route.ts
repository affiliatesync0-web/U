import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * Webhook para la API oficial de WhatsApp Business
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar que sea un mensaje de WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || !message.text) {
      return NextResponse.json({ status: 'No message content' });
    }

    const from = message.from; // Número del remitente
    const text = message.text.body; // Texto del mensaje
    const displayPhoneNumber = value.metadata.display_phone_number; // Número de la empresa

    const { firestore } = initializeFirebase();
    
    // 1. Buscar si el número de la empresa pertenece a un afiliado con el bot activo
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

    // 2. Obtener catálogo de productos para que la IA responda
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

    // 3. Procesar con Genkit
    const aiResponse = await processBotMessage({
      userMessage: text,
      affiliateName: affiliate.firstName || 'Asistente',
      welcomeMessage: affiliate.botWelcomeMessage || 'Hola, ¿cómo puedo ayudarte?',
      catalog: catalog,
      history: [] // Aquí se podría implementar memoria guardando en Firestore
    });

    // 4. Enviar respuesta real a través de la API de WhatsApp
    await sendWhatsAppMessage(from, aiResponse.reply);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('WEBHOOK ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Verificación del Webhook por parte de Meta
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // El VERIFY_TOKEN debe estar en tus variables de entorno (.env)
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  
  return new Response('Forbidden', { status: 403 });
}
