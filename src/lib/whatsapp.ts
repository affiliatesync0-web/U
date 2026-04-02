/**
 * Utilidad para enviar mensajes a través de la API de WhatsApp Business (Cloud API)
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  const accessToken = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error("Faltan las credenciales de WhatsApp (WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID)");
    return;
  }

  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error enviando mensaje de WhatsApp:", data);
    }
    return data;
  } catch (error) {
    console.error("Error en la petición de WhatsApp:", error);
  }
}
