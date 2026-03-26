
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, Globe, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';

export default function Home() {
  const { t } = useLanguage();
  const db = useFirestore();

  // Fetch Site Config Overrides
  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const heroConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'hero-marketing'), [db]);

  const { data: logoOverride, isLoading: isLogoLoading } = useDoc(logoConfigRef);
  const { data: heroOverride } = useDoc(heroConfigRef);

  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const defaultHero = placeholderData.placeholderImages.find(img => img.id === 'hero-marketing');

  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");
  const displayHeroUrl = getGoogleDriveDirectLink(heroOverride?.imageUrl || defaultHero?.imageUrl || "");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-20 flex items-center border-b bg-white sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="relative h-14 w-14 overflow-hidden flex items-center justify-center">
             {isLogoLoading ? (
               <Loader2 className="h-5 w-5 animate-spin text-primary" />
             ) : displayLogoUrl ? (
               <Image 
                  src={displayLogoUrl} 
                  alt="Sync Connect" 
                  fill 
                  className="object-contain" 
                  priority
                  unoptimized
               />
             ) : (
               <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
             )}
          </div>
          <div className="flex flex-col -gap-1">
            <span className="font-headline font-black text-2xl text-slate-900 tracking-tighter leading-none">Sync <span className="text-primary">Connect</span></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Marketing Sync</span>
          </div>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-8">
          <Link className="hidden md:inline-block text-sm font-semibold text-slate-600 hover:text-primary transition-colors" href="/auth/register">
            {t.joinAffiliate}
          </Link>
          <Link className="text-sm font-bold text-slate-800 hover:text-primary transition-colors" href="/auth/login">
            {t.login}
          </Link>
          <Button asChild variant="default" className="hidden sm:flex font-bold rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link href="/auth/register">{t.getStarted}</Link>
          </Button>
          <LanguageToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                <div className="space-y-6">
                  <h1 className="text-5xl font-headline font-black tracking-tight sm:text-6xl xl:text-7xl text-slate-900 leading-[1.1]">
                    {t.heroTitle}
                  </h1>
                  <p className="max-w-[600px] mx-auto lg:mx-0 text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
                    {t.heroSubtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-bold text-white px-12 h-16 rounded-full shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                    <Link href="/auth/register">
                      {t.getStarted} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 px-12 h-16 rounded-full font-bold transition-all">
                    <Link href="/auth/login">
                      {t.affiliatePortal}
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <CheckCircle2 className="h-5 w-5 text-green-500" /> +1k Afiliados
                   </div>
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <CheckCircle2 className="h-5 w-5 text-green-500" /> Pagos Semanales
                   </div>
                </div>
              </div>
              <div className="relative aspect-video lg:aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl group border-8 border-slate-50 bg-muted">
                 {displayHeroUrl ? (
                   <Image 
                     src={displayHeroUrl}
                     alt="Sync Connect Platform"
                     fill
                     className="object-cover transition-transform duration-700 group-hover:scale-105"
                     priority
                     unoptimized
                   />
                 ) : (
                   <div className="flex items-center justify-center h-full">
                     <ImageIcon className="h-20 w-20 text-muted-foreground opacity-10" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-24 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-20">
              <h2 className="text-3xl font-headline font-black sm:text-5xl text-slate-900">Todo lo que necesitas para escalar</h2>
              <p className="max-w-[800px] text-slate-500 text-lg font-medium">Nuestra tecnología te permite enfocarte en lo que mejor sabes hacer: vender.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Globe, title: "Mercado Global", desc: "Vende productos digitales en todo el mundo y recibe tus comisiones localmente.", color: "text-blue-500", bg: "bg-blue-50" },
                { icon: BarChart3, title: "Analíticas Reales", desc: "Monitorea cada clic y cada venta con nuestro panel de control avanzado.", color: "text-primary", bg: "bg-primary/10" },
                { icon: Users, title: "Soporte VIP", desc: "Acompañamiento constante para que tu negocio nunca se detenga.", color: "text-purple-500", bg: "bg-purple-50" }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 group">
                  <div className={`h-16 w-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-slate-900 text-white py-20 px-4 md:px-8 border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link className="flex items-center gap-2" href="/">
              <div className="relative h-12 w-12 flex items-center justify-center">
                 {displayLogoUrl ? (
                   <Image 
                      src={displayLogoUrl} 
                      alt="Sync Connect" 
                      fill 
                      className="object-contain" 
                      unoptimized
                   />
                 ) : (
                   <ImageIcon className="h-6 w-6 text-slate-700" />
                 )}
              </div>
              <span className="font-headline font-black text-xl tracking-tight">Sync <span className="text-primary">Connect</span></span>
            </Link>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              La plataforma definitiva para la sincronización de marketing en Nicaragua. Potenciamos tu crecimiento con herramientas reales y seguras.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Plataforma</h4>
            <nav className="flex flex-col gap-3">
              <Link className="text-slate-400 hover:text-white transition-colors" href="/auth/login">Entrar</Link>
              <Link className="text-slate-400 hover:text-white transition-colors" href="/auth/register">Registrarse</Link>
              <Link className="text-slate-400 hover:text-white transition-colors" href="/auth/admin-login">Administración</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Contacto</h4>
            <nav className="flex flex-col gap-3">
              <a className="text-slate-400 hover:text-white transition-colors" href="mailto:affiliatesync0@gmail.com">Soporte</a>
              <p className="text-slate-500 text-sm mt-4">© 2024 Sync Connect. Todos los derechos reservados.</p>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
