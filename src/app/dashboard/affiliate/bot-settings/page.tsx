"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BotSettingsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard/affiliate')
  }, [router])

  return null
}
