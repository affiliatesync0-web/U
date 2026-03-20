
"use client"

import { Mail } from "lucide-react"

/**
 * Componente de botón flotante para contacto rápido por correo electrónico.
 * Aparece en la esquina inferior derecha con un efecto de pulsación.
 */
export function FloatingContact() {
  return (
    <a
      href="mailto:affiliatesync0@gmail.com"
      className="fixed bottom-6 right-6 z-[999] flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_40px_rgba(40,112,163,0.4)] transition-all hover:scale-110 active:scale-95 group"
      title="Soporte por Correo"
    >
      <Mail className="h-8 w-8" />
      
      {/* Etiqueta flotante al pasar el ratón */}
      <div className="absolute right-20 bg-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl shadow-xl border border-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block whitespace-nowrap">
        ¿Necesitas ayuda? Escríbenos
      </div>
      
      {/* Notificación visual (punto pulsante) */}
      <span className="absolute -top-1 -right-1 flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
        <span className="relative inline-flex rounded-full h-5 w-5 bg-accent"></span>
      </span>
    </a>
  )
}
