"use client"

import { useParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { Loader2, ShoppingCart, CheckCircle2, Star, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
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
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">S</div>
          <span className="font-headline font-black text-lg tracking-tighter uppercase">Sync <span className="text-primary">Connect</span></span>
        </div>
        <Button asChild className="rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 shadow-xl">
          <Link href={checkoutUrl}>EMPEZAR AHORA</Link>
        </Button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative py-24 md:py-40 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,93,27,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-bounce">
            <Star className="h-3 w-3 fill-current" /> Acceso VIP Exclusivo
          </div>
          <h1 className="text-5xl md:text-8xl font-headline font-black tracking-tight leading-[1.1] md:leading-[1] text-slate-950">
            {hero.headline}
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-slate-500 font-medium leading-relaxed">
            {hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button asChild size="lg" className="w-full sm:w-auto h-20 px-12 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-full shadow-[0_20px_50px_rgba(255,93,27,0.3)] transition-all hover:scale-105 active:scale-95 group">
              <Link href={checkoutUrl}>
                {hero.ctaText} <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
              </Link>
            </Button>
          </div>
          
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale">
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><ShieldCheck className="h-4 w-4" /> Pago Seguro</div>
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><CheckCircle2 className="h-4 w-4" /> Garantía de Satisfacción</div>
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><CheckCircle2 className="h-4 w-4" /> Acceso Inmediato</div>
             <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest"><ShieldCheck className="h-4 w-4" /> Soporte 24/7</div>
          </div>
        </div>
      </section>

      {/* PRODUCT IMAGE PREVIEW */}
      {site.productImageUrl && (
        <section className="pb-32 px-6">
          <div className="max-w-6xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative aspect-video rounded-[3rem] overflow-hidden border-[12px] border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] bg-slate-100">
              <img src={site.productImageUrl} alt="Product Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* CONTENT SECTIONS */}
      <section className="py-32 bg-slate-50/50">
        <div className="max-w-5xl mx-auto px-6 space-y-32">
          {sections.map((section: any, i: number) => (
            <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center`}>
              <div className="flex-1 space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <span className="font-black text-lg">{i + 1}</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-headline font-black text-slate-900 leading-tight uppercase italic">{section.title}</h3>
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
                  {section.content}
                </p>
              </div>
              <div className="flex-1 w-full aspect-square md:aspect-auto md:h-[400px] bg-white rounded-[3rem] shadow-xl border-8 border-white ring-1 ring-slate-100 p-10 flex flex-col justify-center gap-6">
                 <div className="space-y-2">
                   <div className="h-2 w-32 bg-primary rounded-full" />
                   <div className="h-2 w-full bg-slate-100 rounded-full" />
                   <div className="h-2 w-full bg-slate-100 rounded-full" />
                   <div className="h-2 w-4/5 bg-slate-100 rounded-full" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="h-20 rounded-2xl bg-slate-50" />
                   <div className="h-20 rounded-2xl bg-slate-50" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto rounded-[4rem] bg-slate-950 p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><ShoppingCart className="h-64 w-64 text-primary" /></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-headline font-black text-white leading-none uppercase italic">
              ¿Listo para <span className="text-primary">Transformar</span> tu Futuro?
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              {footerMessage}
            </p>
            <Button asChild size="lg" className="h-20 px-12 bg-white text-slate-950 hover:bg-primary hover:text-white font-black text-xl rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95">
              <Link href={checkoutUrl}>EMPEZAR AHORA MISMO</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t text-center space-y-4">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">© 2024 Sync Connect Education • All Rights Reserved</p>
        <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-300 uppercase">
          <ShieldCheck className="h-3 w-3" /> Transacción Encriptada SSL
        </div>
      </footer>
    </div>
  );
}
