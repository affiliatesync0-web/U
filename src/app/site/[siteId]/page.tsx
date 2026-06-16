"use client"

import { useParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { Loader2, ShoppingCart, CheckCircle2, Star, ShieldCheck, ArrowRight, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PublicSitePage() {
  const params = useParams()
  const siteId = params.siteId as string
  const db = useFirestore()

  const siteRef = useMemoFirebase(() => (db ? doc(db, 'user_sites', siteId) : null), [db, siteId]);
  const { data: site, isLoading } = useDoc(siteRef);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Generando Experiencia...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return <div className="min-h-screen flex items-center justify-center font-black uppercase">Sitio no encontrado o desactivado.</div>;
  }

  const { hero, sections, footerMessage } = site.content;
  const checkoutUrl = `/checkout/${site.productId}?ref=${site.userId}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-body selection:bg-primary/20 overflow-x-hidden">
      {/* NAVEGACIÓN SIMPLE */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg">S</div>
          <span className="font-headline font-black text-lg tracking-tighter uppercase">Sync <span className="text-primary">Connect</span></span>
        </div>
        <Button asChild className="rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-8 h-12 shadow-2xl">
          <Link href={checkoutUrl}>ADQUIRIR ACCESO</Link>
        </Button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative py-24 md:py-48 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] shadow-sm">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" /> Oportunidad Exclusiva Seleccionada
          </div>
          <h1 className="text-5xl md:text-8xl font-headline font-black tracking-tighter leading-[1.1] md:leading-[1] text-slate-950 uppercase italic">
            {hero.headline}
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-slate-500 font-medium leading-relaxed">
            {hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button asChild size="lg" className="w-full sm:w-auto h-24 px-16 bg-slate-900 hover:bg-slate-800 text-white font-black text-xl rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all hover:scale-105 active:scale-95 group border-b-8 border-primary">
              <Link href={checkoutUrl}>
                {hero.ctaText?.toUpperCase()} <ArrowRight className="ml-3 h-7 w-7 transition-transform group-hover:translate-x-3 text-primary" />
              </Link>
            </Button>
          </div>
          
          <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale">
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><ShieldCheck className="h-4 w-4" /> Pago Blindado</div>
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><CheckCircle2 className="h-4 w-4" /> Garantía Real</div>
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><CheckCircle2 className="h-4 w-4" /> Acceso Inmediato</div>
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><ShieldCheck className="h-4 w-4" /> Soporte VIP</div>
          </div>
        </div>
      </section>

      {/* PRODUCT IMAGE PREVIEW */}
      {site.productImageUrl && (
        <section className="pb-32 px-6">
          <div className="max-w-6xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full opacity-30 group-hover:opacity-40 transition-opacity" />
            <div className="relative aspect-video rounded-[4rem] overflow-hidden border-[15px] border-slate-50 shadow-2xl bg-slate-100">
              <img src={site.productImageUrl} alt="Product Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* CONTENT SECTIONS */}
      <section className="py-40 bg-slate-50/50">
        <div className="max-w-5xl mx-auto px-6 space-y-48">
          {sections.map((section: any, i: number) => (
            <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 md:gap-32 items-center`}>
              <div className="flex-1 space-y-10">
                <div className="h-16 w-16 rounded-3xl bg-slate-950 flex items-center justify-center text-primary shadow-2xl rotate-3">
                  <span className="font-black text-2xl italic">{i + 1}</span>
                </div>
                <div className="space-y-6">
                  <h3 className="text-4xl md:text-6xl font-headline font-black text-slate-900 leading-tight uppercase italic tracking-tighter">{section.title}</h3>
                  <div className="h-2 w-24 bg-primary rounded-full" />
                  <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full aspect-square md:aspect-auto md:h-[500px] bg-white rounded-[4rem] shadow-2xl border-[12px] border-white ring-1 ring-slate-100 p-12 flex flex-col justify-center gap-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><Layout className="h-48 w-48 text-slate-950" /></div>
                 <div className="space-y-4 relative z-10">
                   <div className="h-3 w-40 bg-primary/20 rounded-full" />
                   <div className="h-3 w-full bg-slate-100 rounded-full" />
                   <div className="h-3 w-full bg-slate-100 rounded-full" />
                   <div className="h-3 w-4/5 bg-slate-100 rounded-full" />
                 </div>
                 <div className="grid grid-cols-2 gap-6 relative z-10">
                   <div className="h-24 rounded-3xl bg-slate-50 border border-slate-100" />
                   <div className="h-24 rounded-3xl bg-slate-50 border border-slate-100" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto rounded-[5rem] bg-slate-950 p-16 md:p-32 text-center space-y-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12"><ShoppingCart className="h-80 w-80 text-primary" /></div>
          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl md:text-8xl font-headline font-black text-white leading-none uppercase italic tracking-tighter">
              Acepta el <span className="text-primary underline decoration-primary/50 underline-offset-[15px]">Desafío</span> Elite
            </h2>
            <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
              {footerMessage}
            </p>
            <div className="pt-6">
              <Button asChild size="lg" className="h-24 px-20 bg-white text-slate-950 hover:bg-primary hover:text-white font-black text-2xl rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border-b-8 border-slate-200">
                <Link href={checkoutUrl}>EMPEZAR AHORA MISMO</Link>
              </Button>
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Únete a la Red de Élite Sync Connect</p>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t bg-slate-50/30 text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
           <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg">S</div>
           <p className="text-[11px] font-black uppercase text-slate-900 tracking-[0.5em]">Sync Connect Nicaragua</p>
        </div>
        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">© 2024 Global Education & Management Systems • All Rights Reserved</p>
        <div className="flex items-center justify-center gap-4 text-[9px] font-black text-slate-300 uppercase">
          <ShieldCheck className="h-4 w-4 text-green-600/50" /> Transacción Blindada con Cifrado Militar
        </div>
      </footer>
    </div>
  );
}