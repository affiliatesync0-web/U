
"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import placeholderData from '@/app/lib/placeholder-images.json'

export default function AffiliatePaymentPage() {
  const db = useFirestore()
  const [loading, setLoading] = useState(false)

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'affiliate-payment-link') : null, [db]);
  const { data: config } = useDoc(configRef);

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const paymentLink = config?.value || "https://checkout.syncconnect.ni/activation";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-20">
      <div className="mb-10">
        <Link href="/">
          <div className="relative h-12 w-32 md:h-14 md:w-36 flex items-center justify-center">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-[#111] font-black text-2xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            )}
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-xl border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[3.5rem] bg-white overflow-hidden p-2">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Zap className="h-48 w-48 text-primary" /></div>
          
          <div className="relative z-10 space-y-6">
            <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary mx-auto shadow-2xl animate-bounce">
              <Sparkles className="h-10 w-10 fill-current" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tight leading-none">
                ¡Registro <span className="text-primary">Exitoso!</span>
              </CardTitle>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">Paso Final de Activación</p>
            </div>
          </div>
        </div>

        <CardContent className="p-10 md:p-14 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase">Activa tu cuenta de Embajador</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Para habilitar tu acceso al <b>Marketplace Platinum</b>, las herramientas de <b>IA Genkit</b> y empezar a cobrar comisiones, es necesario realizar el pago único de activación de la plataforma.
            </p>

            <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Concepto:</span>
                <span className="text-xs font-black uppercase text-slate-900">Membresía Sync Connect</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-[10px] font-black uppercase text-slate-400">Estado:</span>
                <BadgeCheck className="text-amber-500 h-4 w-4" />
                <span className="text-xs font-black uppercase text-amber-600 animate-pulse">Pendiente de Pago</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              asChild
              className="w-full h-20 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-lg uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <a href={paymentLink}>
                IR AL PAGO AHORA <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2 text-primary" />
              </a>
            </Button>
            
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Una vez realizado el pago, el administrador activará tu cuenta en un máximo de 24 horas.
            </p>
          </div>

          <div className="pt-8 border-t flex items-center justify-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Transacción 100% Segura • SSL Encriptado
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        © 2024 Sync Connect Nicaragua • Tecnología de Red de Mercadeo Elite
      </p>
    </div>
  )
}

function BadgeCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
