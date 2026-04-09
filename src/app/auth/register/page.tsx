
"use client"

import { Suspense } from 'react'
import { ShoppingBag, Target, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { doc } from 'firebase/firestore'
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'

function RegisterSelectionContent() {
  const db = useFirestore()
  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 transition-colors duration-300">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <Link href="/" className="mb-12 group transition-transform hover:scale-105">
        <div className="h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card flex items-center justify-center ring-8 ring-primary/5 border border-border/50">
          {displayLogoUrl ? (
            <Image src={displayLogoUrl} alt="Logo" width={80} height={80} className="p-3 object-contain" unoptimized />
          ) : (
            <span className="text-primary text-2xl font-black">SC</span>
          )}
        </div>
      </Link>

      <div className="w-full max-w-4xl">
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center">
            <h1 className="text-5xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">Crea tu <span className="text-primary">Cuenta</span></h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Únete a la red líder en Nicaragua</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/auth/register/buyer" className="p-12 rounded-[3.5rem] bg-card shadow-2xl hover:ring-8 hover:ring-primary/5 transition-all text-left border border-border/50 group block">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 uppercase">Quiero Comprar</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">Accede a formación premium y servicios digitales certificados.</p>
            </Link>

            <Link href="/auth/register/affiliate" className="p-12 rounded-[3.5rem] bg-card shadow-2xl hover:ring-8 hover:ring-primary/5 transition-all text-left border border-border/50 group block">
              <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 uppercase">Quiero Vender</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">Genera comisiones reales y escala tu negocio digital hoy mismo.</p>
            </Link>
          </div>

          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-8">
            ¿Ya tienes cuenta? <Link href="/auth/login" className="text-primary font-black hover:underline ml-1">Inicia Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <RegisterSelectionContent />
    </Suspense>
  )
}
