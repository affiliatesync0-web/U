
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, Globe, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';

export default function Home() {
  const { t } = useLanguage();
  const db = useFirestore();

  // Fetch All Site Config Overrides
  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs, isLoading: isConfigLoading } = useCollection(configQuery);

  const getOverride = (id: string) => configs?.find(c => c.id === id);

  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const defaultHero = placeholderData.placeholderImages.find(img => img.id === 'hero-marketing');

  const logoConfig = getOverride('site-logo');
  const heroConfig = getOverride('hero-marketing');

  const displayLogoUrl = getGoogleDriveDirectLink(logoConfig?.imageUrl || defaultLogo?.imageUrl || "");
  const displayHeroUrl = getGoogleDriveDirectLink(heroConfig?.imageUrl || defaultHero?.imageUrl || "");

  const features = [
    { 
      id: 'feature-1', 
      icon: Globe, 
      title: "Mercado Global", 
      desc: "Vende productos digitales en todo el mundo y recibe tus comisiones localmente.", 
      color: "text-blue-500", 
      bg: "bg-blue-50" 
    },
    { 
      id: 'feature-2', 
      icon: BarChart3, 
      title: "Analíticas Reales", 
      desc: "Monitorea cada clic y cada venta con nuestro panel de control avanzado.", 
      color: "text-primary", 
      bg: "bg-primary/10" 
    },
    { 
      id: 'feature-3', 
      icon: Users, 
      title: "Soporte VIP", 
      desc: "Acompañamiento constante para que tu negocio nunca se detenga.", 
      color: "text-purple-500", 
      bg: "bg-purple-50" 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-4 lg:px-6 h-20 flex items-center bg-white sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="relative h-14 w-14 overflow-hidden flex items-center justify-center">
             {isConfigLoading ? (
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
          <div className="flex flex-col">
            <span className="font-headline font-black text-xl text-slate-900 tracking-tighter leading-none">Sync <span className="text-primary">Connect</span></span>
          </div>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-8">
          <Link className="hidden md:inline-block text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-primary transition-colors" href="/auth/register">
            {t.joinAffiliate}
          </Link>
          <Link className="hidden md:inline-block text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-primary transition-colors" href="/auth/login">
            {t.login}
          </Link>
          <Button asChild variant="default" className="font-black text-[10px] uppercase tracking-widest rounded-full px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-11">
            <Link href="/auth/register">{t.getStarted}</Link>
          </Button>
          <LanguageToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-16 lg:py-24 bg-white text-center">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="flex flex-col items-center space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl font-headline font-black tracking-tight sm:text-6xl xl:text-7xl text-slate-900 leading-[1.1]">
                  {t.heroTitle}
                </h1>
                <p className="max-w-[700px] mx-auto text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
                  {t.heroSubtitle}
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row justify-center w-full">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest text-white px-12 h-14 rounded-full shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                  <Link href="/auth/register">
                    {t.getStarted} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-slate-100 text-slate-900 hover:bg-slate-50 px-12 h-14 rounded-full font-black text-xs uppercase tracking-widest transition-all">
                  <Link href="/auth/login">
                    {t.affiliatePortal}
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-2">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> +1k Afiliados
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Pagos Semanales
                 </div>
              </div>
              
              <div className="w-full max-w-4xl mt-12 relative aspect-video overflow-hidden rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-[12px] border-slate-50 bg-slate-50 group">
                 {displayHeroUrl ? (
                   <Image 
                     src={displayHeroUrl}
                     alt="Sync Connect Platform"
                     fill
                     className="object-cover transition-transform duration-1000 group-hover:scale-105"
                     priority
                     unoptimized
                   />
                 ) : (
                   <div className="flex items-center justify-center h-full">
                     <ImageIcon className="h-20 w-20 text-muted-foreground opacity-10" />
                   </div>
                 )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-24 bg-[#F8FAFC]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <h2 className="text-4xl font-headline font-black sm:text-5xl text-slate-900 tracking-tight">Todo lo que necesitas para escalar</h2>
              <p className="max-w-[700px] text-slate-500 text-base font-medium">Nuestra tecnología te permite enfocarte en lo que mejor sabes hacer: vender.</p>
            </div>
            
            <div className="max-w-6xl mx-auto rounded-[4rem] border-[3px] border-slate-900 p-8 md:p-12 bg-white shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, i) => {
                  const override = getOverride(feature.id);
                  const displayImg = getGoogleDriveDirectLink(override?.imageUrl || "");
                  
                  return (
                    <div key={i} className="flex flex-col items-center text-center space-y-6 p-6">
                      <div className={`h-14 w-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center shadow-inner overflow-hidden relative`}>
                        {displayImg ? (
                          <Image src={displayImg} alt={feature.title} fill className="object-cover" unoptimized />
                        ) : (
                          <feature.icon className="h-7 w-7" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{feature.title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#0F172A] text-white py-20 px-4 md:px-8">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl">
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
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
              La plataforma definitiva para la sincronización de marketing en Nicaragua. Potenciamos tu crecimiento con herramientas reales y seguras.
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Plataforma</h4>
            <nav className="flex flex-col gap-4">
              <Link className="text-slate-400 hover:text-white transition-colors text-sm font-bold" href="/auth/login">Entrar</Link>
              <Link className="text-slate-400 hover:text-white transition-colors text-sm font-bold" href="/auth/register">Registrarse</Link>
              <Link className="text-slate-400 hover:text-white transition-colors text-sm font-bold" href="/auth/admin-login">Administración</Link>
            </nav>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Contacto</h4>
            <nav className="flex flex-col gap-4">
              <a className="text-slate-400 hover:text-white transition-colors text-sm font-bold" href="mailto:affiliatesync0@gmail.com">Soporte</a>
              <p className="text-slate-500 text-[10px] mt-4 font-black uppercase tracking-widest">© 2024 Sync Connect</p>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
