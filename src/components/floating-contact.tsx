
"use client"

import { Mail } from "lucide-react"

/**
 * Componente de botón flotante para contacto rápido por correo electrónico.
 * Se ha simplificado eliminando etiquetas adicionales para un aspecto más limpio.
 */
export function FloatingContact() {
  return (
    <a
      href="mailto:affiliatesync0@gmail.com"
      className="fixed bottom-6 right-6 z-[999] flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_40px_rgba(40,112,163,0.4)] transition-all hover:scale-110 active:scale-95"
      title="Soporte por Correo"
    >
      <Mail className="h-8 w-8" />
    </a>
  )
}
