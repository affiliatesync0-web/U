/**
 * Utilidad para enviar mensajes a través de la API local de OpenWA (Sessions API)
 * Configurado para interactuar con un servidor local de WhatsApp Automation.
 */
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getOpenWaConfig() {
  try {
    const { firestore } = initializeFirebase();
    const configDoc = await getDoc(doc(firestore, 'site_config', 'whatsapp-api'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      return {
        url: (data.baseUrl || process.env.WHATSAPP_API_URL || "http://localhost:2785").trim(),
        key: (data.apiKey || process.env.WHATSAPP_API_KEY || "YOUR_API_KEY").trim(),
        session: (data.sessionName || "my-bot").trim()
      };
    }
  } catch (e) {
    console.error("Error fetching OpenWA config:", e);
  }

  return {
    url: process.env.WHATSAPP_API_URL || "http://localhost:2785",
    key: process.env.WHATSAPP_API_KEY || "YOUR_API_KEY",
    session: "my-bot"
  };
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const config = await getOpenWaConfig();
  
  if (!config.url) {
    console.error("Falta la URL base de OpenWA API");
    return { success: false, error: "Configuration missing" };
  }

  // El formato esperado por OpenWA para el chatId es numero@c.us
  const cleanNumber = to.replace(/\D/g, '');
  const chatId = `${cleanNumber}@c.us`;

  const targetUrl = `${config.url}/api/sessions/${config.session}/messages/send-text`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "X-API-Key": config.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: chatId,
        text: message,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error enviando mensaje via OpenWA:", data);
    }
    return data;
  } catch (error) {
    console.error("Error en la conexión con OpenWA API:", error);
    return { success: false, error: "OpenWA Server Offline" };
  }
}
