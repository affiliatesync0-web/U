"use client"

import { Suspense } from 'react'
import { ShoppingBag, Target, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { doc } from 'firebase/firestore'
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function RegisterSelectionContent() {
  const db = useFirestore()
  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  return (
    <div className="min-h-screen bg-white md:bg-[#EAEDED] flex flex-col items-center pt-8 pb-12">
      
      {/* LOGO */}
      <div className="mb-6">
        <Link href="/">
          <div className="relative h-12 w-32 md:h-14 md:w-36">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-[#111] font-black text-2xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            )}
          </div>
        </Link>
      </div>

      <div className="w-full max-w-[400px] bg-white border border-[#ddd] shadow-none md:shadow-sm rounded-[4px] p-8 space-y-6">
        <h1 className="text-[28px] font-normal text-[#111] leading-tight">Crear cuenta</h1>
        
        <p className="text-[14px] text-[#111] font-bold">Selecciona tu objetivo principal:</p>

        <div className="space-y-4">
          <Link href="/auth/register/buyer" className="group flex items-center justify-between p-4 border border-[#ddd] rounded-md hover:bg-[#f7fafa] hover:border-[#007185] transition-all">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 flex items-center justify-center rounded-full text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#111]">Quiero comprar</h3>
                <p className="text-[11px] text-[#555]">Acceder a formación premium</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#888] group-hover:text-[#111] transition-colors" />
          </Link>

          <Link href="/auth/register/affiliate" className="group flex items-center justify-between p-4 border border-[#ddd] rounded-md hover:bg-[#f7fafa] hover:border-[#007185] transition-all">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-50 flex items-center justify-center rounded-full text-orange-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#111]">Quiero vender</h3>
                <p className="text-[11px] text-[#555]">Generar comisiones reales</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#888] group-hover:text-[#111] transition-colors" />
          </Link>
        </div>

        <div className="pt-6 border-t border-[#eee]">
          <p className="text-[12px] text-[#111]">
            ¿Ya tienes una cuenta? <Link href="/auth/login" className="text-[#0066c0] hover:text-[#c45500] hover:underline font-bold">Iniciar sesión <ChevronRight className="inline h-3 w-3" /></Link>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 w-full max-w-xl text-center space-y-4 border-t border-[#eee] pt-8 bg-gradient-to-b from-[#eee] to-transparent bg-[length:100%_1px] bg-no-repeat">
        <div className="flex justify-center gap-8">
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Condiciones de uso</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Aviso de privacidad</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Ayuda</Link>
        </div>
        <p className="text-[11px] text-[#555]">© 2024, SyncConnect.com, Inc. o sus afiliados</p>
      </footer>
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