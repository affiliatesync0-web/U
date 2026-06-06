/**
 * Utilidad para enviar mensajes a través de la API local de OpenWA (Sessions API)
 * Configurado para interactuar con un servidor local de WhatsApp Automation.
 */

const OPENWA_BASE_URL = process.env.WHATSAPP_API_URL || "http://localhost:2785";
const OPENWA_API_KEY = process.env.WHATSAPP_API_KEY || "YOUR_API_KEY";
const SESSION_NAME = "my-bot";

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!OPENWA_BASE_URL) {
    console.error("Falta la URL base de OpenWA API");
    return;
  }

  // El formato esperado por OpenWA para el chatId es numero@c.us
  const cleanNumber = to.replace(/\D/g, '');
  const chatId = `${cleanNumber}@c.us`;

  const url = `${OPENWA_BASE_URL}/api/sessions/${SESSION_NAME}/messages/send-text`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENWA_API_KEY}`,
        "X-API-Key": OPENWA_API_KEY,
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
    // Fallback: Si el servidor local no está disponible, loguear para depuración.
    return { success: false, error: "OpenWA Server Offline" };
  }
}
