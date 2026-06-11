
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirección automática a la raíz para unificar la entrada de acceso.
 * La página principal (/) ahora contiene el panel de login oficial.
 */
export default function AuthLoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/')
  }, [router])

  return null
}
