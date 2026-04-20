"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  Users,
  BadgeDollarSign,
  LogOut,
  ShoppingBag,
  Palette,
  Users2,
  Flame,
  ShoppingBasket,
  Mail,
  Clock,
  ShieldCheck,
  UserCircle,
  Zap,
  MapPin,
  MessageSquareShare,
  Globe,
  Bell,
  ChevronRight,
  Inbox,
  Send,
  GraduationCap,
  Sparkles
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/dashboard/nav-main"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/components/language-context"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase"
import { doc } from "firebase/firestore"
import placeholderData from "@/app/lib/placeholder-images.json"
import { getGoogleDriveDirectLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { Badge } from "@/components/ui/badge"

interface DashboardShellProps {
  children: React.ReactNode
  role: "admin" | "affiliate" | "buyer"
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();
  const auth = useAuth();
  
  const [mounted, setMounted] = useState(false);

  // IDENTIFICACIÓN MAESTRA: Este correo SIEMPRE es admin
  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
  const cleanEmail = user?.email?.toLowerCase().trim() || '';
  const isUserAdmin = cleanEmail === ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isUserLoading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (isUserAdmin && !pathname.startsWith('/dashboard/admin')) {
      window.location.href = '/dashboard/admin'; 
      return;
    }

    if (!isUserAdmin && pathname.startsWith('/dashboard/admin')) {
      router.replace('/dashboard/affiliate'); 
      return;
    }
  }, [user, isUserLoading, mounted, pathname, isUserAdmin, router]);

  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: affiliateProfile } = useDoc(affiliateRef);

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = 'https://syncacademy.systeme.io/sync-connect';
  }

  if (mounted && !isUserLoading && isUserAdmin && !pathname.startsWith('/dashboard/admin')) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black uppercase tracking-[0.5em] animate-pulse text-center p-6">Sincronizando Nodo Maestro...</div>;
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-[6px] border-primary/10 border-t-primary animate-spin" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary/30" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Sincronizando Identidad</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-300">Sync Connect v2.0</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null;

  if (role === 'affiliate' && affiliateProfile?.status === 'Pending' && !isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6 text-center text-foreground">
        <div className="max-w-md space-y-10 animate-in fade-in zoom-in duration-700">
          <div className="h-32 w-32 bg-primary/10 rounded-[3.5rem] flex items-center justify-center text-primary shadow-2xl mx-auto rotate-3 group">
            <Clock className="h-16 w-16 animate-pulse group-hover:rotate-12 transition-transform" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-headline font-black tracking-tight leading-none uppercase italic">Estatus: <span className="text-primary">En Revisión</span></h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-6">Tu perfil está siendo auditado por el equipo legal. Recibirás un Gmail de confirmación cuando tu licencia Platinum sea habilitada.</p>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <Button onClick={() => window.location.reload()} className="h-20 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 active:scale-95 transition-all">REVISAR AHORA</Button>
            <Button onClick={handleLogout} variant="ghost" className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-red-500">
              SALIR DE LA PLATAFORMA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const adminItems = [
    { title: t.overview, url: "/dashboard/admin", icon: LayoutDashboard },
    { title: "Buzón Maestro", url: "/dashboard/admin/support", icon: Inbox },
    { title: "Academia Admin", url: "/dashboard/admin/academy", icon: GraduationCap },
    { title: t.products, url: "/dashboard/admin/products", icon: Package },
    { title: "Estrategias Lab", url: "/dashboard/admin/sales-lab", icon: Zap },
    { title: t.affiliateDirectory, url: "/dashboard/admin/affiliates", icon: Users },
    { title: "Mapa de Red", url: "/dashboard/admin/map", icon: MapPin },
    { title: t.buyers, url: "/dashboard/admin/buyers", icon: Users2 },
    { title: t.allSales, url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: t.design, url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: t.dashboard, url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: "Mi Buzón", url: "/dashboard/affiliate/support", icon: Mail },
    { title: "Marketplace", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: "Bot de Ventas", url: "/dashboard/affiliate/bot-settings", icon: Zap },
    { title: "AI Site Builder", url: "/dashboard/affiliate/site-builder", icon: Globe },
    { title: "Sales Lab", url: "/dashboard/affiliate/sales-lab", icon: Flame },
    { title: "Copiloto IA", url: "/dashboard/affiliate/sales-copilot", icon: Sparkles },
    { title: t.registerSale, url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: t.buyers, url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Mi Billetera", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const buyerItems = [
    { title: t.dashboard, url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: "Explorar Cursos", url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const getMenu = () => {
    if (isUserAdmin) return adminItems;
    if (role === 'buyer') return buyerItems;
    return affiliateItems;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="premium-sidebar">
        <SidebarHeader className="bg-white dark:bg-slate-950 transition-colors">
          <div className="flex items-center gap-4 px-4 py-10 md:py-12">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-100 dark:ring-slate-800 flex items-center justify-center shrink-0">
              {displayLogoUrl ? (
                <Image src={displayLogoUrl} alt="Logo" fill className="object-contain p-2" unoptimized />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground opacity-10" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-black text-xl tracking-tighter text-slate-900 dark:text-white uppercase italic">Sync <span className="text-primary">Connect</span></span>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2 py-0">
                  {isUserAdmin ? 'ADMIN' : (role === 'buyer' ? 'ALUMNO' : 'PARTNER')}
                </Badge>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-white dark:bg-slate-950 transition-colors px-3 space-y-2">
          <NavMain 
            items={getMenu()} 
            label={isUserAdmin ? "CENTRO DE MANDO" : "NAVEGACIÓN"} 
          />
        </SidebarContent>
        <SidebarFooter className="bg-white dark:bg-slate-950 border-t border-slate-50 dark:border-slate-900 p-6 transition-colors">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="h-14 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group">
                <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-black uppercase text-[11px] tracking-[0.2em]">{t.logout}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
        <header className="glass-header flex h-20 shrink-0 items-center gap-2 sticky top-0 z-40 px-6 transition-all">
          <SidebarTrigger className="-ml-1 text-primary hover:bg-primary/5 rounded-xl h-10 w-10 transition-colors" />
          <Separator orientation="vertical" className="mx-4 h-6 bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 overflow-hidden">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-primary/40" />
                {isUserAdmin ? "Admin Control" : (role === 'buyer' ? "Learning Area" : "Business Workspace")}
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
               <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En línea</span>
            </div>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-12 lg:p-16 text-foreground overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-1000">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
