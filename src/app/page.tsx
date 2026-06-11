
"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Loader2,
  Lock,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Server
} from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';
import placeholderData from '@/app/lib/placeholder-images.json';

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);

  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs } = useCollection(configQuery);

  const getOverride = (id: string) => configs?.find(c => c.id === id);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(getOverride('site-logo')?.imageUrl || defaultLogo?.imageUrl || "");

  useEffect(() => {
    async function handleRedirection() {
      if (isUserLoading) return;

      if (user) {
        const cleanEmail = user.email?.toLowerCase().trim();
        if (cleanEmail === ADMIN_EMAIL) {
          router.push('/dashboard/admin');
          return;
        }

        try {
          const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
          if (affSnap.exists()) {
            router.push('/dashboard/affiliate');
          } else {
            router.push('/dashboard/buyer');
          }
        } catch (e) {
          console.error("Error redirecting home:", e);
          router.push('/dashboard/buyer');
        }
      } else {
        setCheckingRole(false);
      }
    }

    handleRedirection();
  }, [user, isUserLoading, router, db]);

  if (isUserLoading || (user && checkingRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Sincronizando Infraestructura...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-slate-950 h-20 flex items-center px-6 md:px-12 justify-between sticky top-0 z-[100] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-32 md:h-12 md:w-40">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-white font-black text-xl italic uppercase tracking-tighter">Sync <span className="text-primary">Connect</span></span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild className="h-11 px-8 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-2xl">
             <Link href="/auth/login">INICIAR SESIÓN</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative flex-1 flex items-center justify-center py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,153,0,0.03),transparent_70%)]" />
          
          <div className="max-w-4xl w-full relative z-10 text-center space-y-12">
             <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                   <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Sistema de Gestión de Activos Elite
                </div>
                <h1 className="text-5xl md:text-8xl font-headline font-black text-slate-950 leading-[0.9] tracking-tighter uppercase italic">
                   Portal de <span className="text-primary">Acceso</span> Privado
                </h1>
                <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                   Bienvenido a la infraestructura de <b>Sync Connect Nicaragua</b>. Identifíquese para acceder a su panel de gestión y catálogo exclusivo.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-10 text-left group hover:bg-slate-900 hover:text-white transition-all duration-500 ring-1 ring-slate-100">
                   <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 mb-8 shadow-inner group-hover:bg-primary transition-colors">
                      <LayoutDashboard className="h-7 w-7" />
                   </div>
                   <h3 className="text-xl font-headline font-black uppercase italic mb-2 tracking-tight">Afiliados Platinum</h3>
                   <p className="text-sm font-medium opacity-60 mb-8 leading-relaxed">Gestione su red, monitoree comisiones y acceda a las herramientas de cierre Sync Lab AI.</p>
                   <Button asChild className="w-full h-14 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest group-hover:bg-white group-hover:text-slate-900">
                      <Link href="/auth/login" className="flex items-center justify-center gap-2 text-inherit">ENTRAR AL PANEL <ChevronRight className="h-4 w-4" /></Link>
                   </Button>
                </Card>

                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white p-10 text-left ring-1 ring-white/10 relative overflow-hidden">
                   <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary mb-8 shadow-inner border border-white/5">
                      <Lock className="h-7 w-7" />
                   </div>
                   <h3 className="text-xl font-headline font-black uppercase italic mb-2 tracking-tight">Portal Clientes</h3>
                   <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed">Acceda a sus productos digitales adquiridos y gestione sus pagos de forma segura.</p>
                   <Button asChild className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
                      <Link href="/auth/login" className="flex items-center justify-center gap-2 text-inherit">ÁREA DE CLIENTES <ChevronRight className="h-4 w-4" /></Link>
                   </Button>
                </Card>
             </div>
          </div>
        </section>

        <footer className="py-12 px-6 border-t bg-white flex flex-col md:flex-row items-center justify-between gap-6">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">© 2024 Sync Connect Nicaragua • Infraestructura Propietaria</p>
           <div className="flex items-center gap-8">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck className="h-3.5 w-3.5" /> Encriptación AES-256
              </span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <Lock className="h-3.5 w-3.5" /> Firewall Corporativo
              </span>
           </div>
        </footer>
      </main>
    </div>
  );
}
