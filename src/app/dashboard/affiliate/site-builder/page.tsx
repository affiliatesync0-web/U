"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * El constructor de sitios web ha sido deshabilitado para los afiliados por solicitud del administrador.
 * Esta página redirige ahora al panel principal.
 */
export default function SiteBuilderRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard/affiliate')
  }, [router])

  return null
}
