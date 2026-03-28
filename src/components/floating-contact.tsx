
"use client"

import { MessageCircle } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'

/**
 * Componente de botón flotante para contacto rápido por WhatsApp.
 * Se conecta a la base de datos para obtener el número configurado por el administrador.
 */
export function FloatingContact() {
  const db = useFirestore();
  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs } = useCollection(configQuery);

  const whatsappConfig = configs?.find(c => c.id === 'site-whatsapp');
  const phoneNumber = whatsappConfig?.value || "";
  
  if (!phoneNumber) return null;

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[999] flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_10px_40px_rgba(37,211,102,0.4)] transition-all hover:scale-110 active:scale-95 animate-in fade-in zoom-in duration-500"
      title="Contactar por WhatsApp"
    >
      <MessageCircle className="h-8 w-8 fill-current" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
      </span>
    </a>
  )
}
