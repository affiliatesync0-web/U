
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, Globe, CheckCircle2, Loader2, Image as ImageIcon, Facebook, Instagram, Music2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
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

  const fbUrl = getOverride('social-facebook')?.value;
  const igUrl = getOverride('social-instagram')?.value;
  const tkUrl = getOverride('social-tiktok')?.value;

  const features = [
    { 
      id: 'feature-1', 
      icon: Globe, 
      title: "Mercado Global", 
      desc: "Vende productos digitales en todo el mundo y recibe tus comisiones localmente.", 
      color: "text-blue-500", 
      bg: "bg-blue-50 dark:bg-blue-900/20" 
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
      bg: "bg-purple-50 dark:bg-purple-900/20" 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="px-4 lg:px-6 h-20 flex items-center bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/40">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="relative h-12 w-12 overflow-hidden flex items-center justify-center rounded-xl bg-card shadow-sm border border-border/50">
             {isConfigLoading ? (
               <Loader2 className="h-5 w-5 animate-spin text-primary" />
             ) : displayLogoUrl ? (
               <Image 
                  src={displayLogoUrl} 
                  alt="Sync Connect" 
                  fill 
                  className="object-contain p-2" 
                  priority
                  unoptimized
               />
             ) : (
               <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
             )}
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-xl text-foreground tracking-tighter leading-none">Sync <span className="text-primary">Connect</span></span>
          </div>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-6">
          <Link className="hidden lg:inline-block text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors" href="/auth/register">
            {t.joinAffiliate}
          </Link>
          <Link className="hidden lg:inline-block text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors" href="/auth/login">
            {t.login}
          </Link>
          <Button asChild variant="default" className="font-black text-[10px] uppercase tracking-widest rounded-full px-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-10">
            <Link href="/auth/register">{t.getStarted}</Link>
          </Button>
          <div className="flex items-center gap-1 ml-2 border-l pl-4 border-border/50">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-16 lg:py-32 bg-background text-center overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,93,27,0.05),transparent_70%)] pointer-events-none" />
          <div className="container px-4 md:px-6 mx-auto max-w-5xl relative z-10">
            <div className="flex flex-col items-center space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl font-headline font-black tracking-tight sm:text-6xl xl:text-8xl text-foreground leading-[1.1]">
                  {t.heroTitle}
                </h1>
                <p className="max-w-[700px] mx-auto text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
                  {t.heroSubtitle}
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row justify-center w-full">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest text-white px-12 h-16 rounded-full shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                  <Link href="/auth/register">
                    {t.getStarted} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-border text-foreground hover:bg-muted px-12 h-16 rounded-full font-black text-xs uppercase tracking-widest transition-all">
                  <Link href="/auth/login">
                    {t.affiliatePortal}
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-4">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> +1k Afiliados
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> Pagos Semanales
                 </div>
              </div>
              
              <div className="w-full max-w-5xl mt-16 relative aspect-video overflow-hidden rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-card bg-card group">
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

        <section className="w-full py-24 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <h2 className="text-4xl font-headline font-black sm:text-5xl text-foreground tracking-tight">Todo lo que necesitas para escalar</h2>
              <p className="max-w-[700px] text-muted-foreground text-base font-medium">Nuestra tecnología te permite enfocarte en lo que mejor sabes hacer: vender.</p>
            </div>
            
            <div className="max-w-6xl mx-auto rounded-[4rem] border-[3px] border-foreground p-8 md:p-12 bg-card shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, i) => {
                  const override = getOverride(feature.id);
                  const displayImg = getGoogleDriveDirectLink(override?.imageUrl || "");
                  
                  return (
                    <div key={i} className="flex flex-col items-center text-center space-y-6 p-6 group">
                      <div className={`h-16 w-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center shadow-inner overflow-hidden relative transition-transform group-hover:scale-110 duration-500`}>
                        {displayImg ? (
                          <Image src={displayImg} alt={feature.title} fill className="object-cover" unoptimized />
                        ) : (
                          <feature.icon className="h-8 w-8" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-slate-950 text-white py-20 px-4 md:px-8 border-t border-white/5">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link className="flex items-center gap-2" href="/">
              <div className="relative h-12 w-12 flex items-center justify-center bg-white rounded-xl">
                 {displayLogoUrl ? (
                   <Image 
                      src={displayLogoUrl} 
                      alt="Sync Connect" 
                      fill 
                      className="object-contain p-2" 
                      unoptimized
                   />
                 ) : (
                   <ImageIcon className="h-6 w-6 text-slate-900" />
                 )}
              </div>
              <span className="font-headline font-black text-xl tracking-tight">Sync <span className="text-primary">Connect</span></span>
            </Link>
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
              La plataforma definitiva para la sincronización de marketing en Nicaragua. Potenciamos tu crecimiento con herramientas reales y seguras.
            </p>
            <div className="flex items-center gap-4 pt-4">
               {fbUrl && (
                 <a href={fbUrl} target="_blank" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                   <Facebook className="h-5 w-5" />
                 </a>
               )}
               {igUrl && (
                 <a href={igUrl} target="_blank" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                   <Instagram className="h-5 w-5" />
                 </a>
               )}
               {tkUrl && (
                 <a href={tkUrl} target="_blank" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                   <Music2 className="h-5 w-5" />
                 </a>
               )}
            </div>
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
