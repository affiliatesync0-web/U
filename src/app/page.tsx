
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Megaphone, ArrowRight, Globe, BarChart3, Users } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Home() {
  const { t } = useLanguage();
  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'hero-marketing');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Megaphone className="h-6 w-6 text-primary" />
          <span className="font-headline font-bold text-lg md:text-xl text-primary">{t.brand}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-6">
          <Link className="hidden sm:inline-block text-sm font-medium hover:text-primary transition-colors" href="/auth/register">
            {t.joinAffiliate}
          </Link>
          <Link className="text-xs sm:text-sm font-medium hover:text-primary transition-colors" href="/auth/login">
            {t.login}
          </Link>
          <Link className="text-xs sm:text-sm font-medium hover:text-primary transition-colors" href="/auth/admin-login">
            {t.adminLogin}
          </Link>
          <LanguageToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-2">
                    #1 Red de Marketing de Afiliados en Nicaragua
                  </div>
                  <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-7xl/none text-[#2870A3]">
                    {t.heroTitle}
                  </h1>
                  <p className="max-w-[600px] mx-auto lg:mx-0 text-muted-foreground md:text-xl font-body leading-relaxed">
                    Escala tus ventas con herramientas de marketing de última generación y productos que convierten de verdad.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center lg:justify-start">
                  <Button asChild size="lg" className="bg-[#2870A3] hover:bg-[#1e5a82] font-bold text-white px-10 h-14 rounded-xl shadow-xl hover:shadow-2xl transition-all">
                    <Link href="/auth/register">
                      {t.getStarted} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-2 border-[#A37EDC] text-[#A37EDC] hover:bg-[#f3effb] px-10 h-14 rounded-xl font-bold transition-all">
                    <Link href="/auth/login">
                      {t.affiliatePortal}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl border-[8px] border-white/80 hidden md:block">
                 <Image 
                   src={heroImage?.imageUrl || "https://picsum.photos/seed/nica_marketing/1200/800"}
                   alt={heroImage?.description || "Marketing Dashboard"}
                   fill
                   className="object-cover hover:scale-105 transition-transform duration-1000"
                   priority
                   data-ai-hint={heroImage?.imageHint || "digital marketing"}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#2870A3]">Impulsa tu Presencia Digital</h2>
                <p className="max-w-[800px] text-muted-foreground md:text-lg font-body">
                  Nuestra plataforma está diseñada por marketers para marketers, enfocada en la conversión y el ROI.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group flex flex-col items-center space-y-4 text-center p-10 rounded-3xl bg-white border border-slate-100 transition-all hover:border-primary/20 hover:shadow-2xl hover:-translate-y-1">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-[#2870A3] group-hover:bg-[#2870A3] group-hover:text-white transition-colors shadow-inner">
                  <Globe className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold font-headline">Alcance Global</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Promueve productos en todo el mercado hispanohablante con pagos directos en Nicaragua.
                </p>
              </div>
              <div className="group flex flex-col items-center space-y-4 text-center p-10 rounded-3xl bg-white border border-slate-100 transition-all hover:border-primary/20 hover:shadow-2xl hover:-translate-y-1">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50 text-[#A37EDC] group-hover:bg-[#A37EDC] group-hover:text-white transition-colors shadow-inner">
                  <BarChart3 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold font-headline">Datos en Vivo</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Analíticas precisas de cada clic para que sepas qué campañas están generando dinero.
                </p>
              </div>
              <div className="group flex flex-col items-center space-y-4 text-center p-10 rounded-3xl bg-white border border-slate-100 transition-all hover:border-primary/20 hover:shadow-2xl hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-inner">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold font-headline">Comunidad Elite</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Únete a los mejores afiliados de la región y comparte estrategias ganadoras.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-8 sm:flex-row py-16 w-full shrink-0 items-center px-4 md:px-6 border-t bg-slate-50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <p className="text-lg font-bold text-primary">AffiliateSync</p>
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            La plataforma líder en marketing de afiliados para el mercado nicaragüense.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 sm:ml-auto">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#2870A3]">Información Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Términos y Condiciones</Link>
              <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Política de Privacidad</Link>
              <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Acuerdo de Afiliado</Link>
            </nav>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#A37EDC]">Soporte Técnico</h4>
            <nav className="flex flex-col gap-2">
              <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Centro de Ayuda</Link>
              <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Contacto de Soporte</Link>
              <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Preguntas Frecuentes</Link>
            </nav>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground sm:self-end">
          © 2024 AffiliateSync. Hecho con pasión por el marketing en Nicaragua.
        </p>
      </footer>
    </div>
  );
}
