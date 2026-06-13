"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RemovedSupportPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/admin') }, [router])
  return null
}