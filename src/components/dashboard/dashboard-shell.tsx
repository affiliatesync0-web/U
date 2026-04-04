
"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  Users,
  BadgeDollarSign,
  LogOut,
  ShoppingBag,
  Palette,
  Loader2,
  Users2,
  Image as ImageIcon,
  Flame,
  ShoppingBasket,
  Mail,
  Clock,
  ShieldCheck,
  UserCircle,
  MessageSquare,
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import placeholderData from "@/app/lib/placeholder-images.json"
import { getGoogleDriveDirectLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { useAuth } from "@/firebase"

interface DashboardShellProps {
  children: React.ReactNode
  role: "admin" | "affiliate" | "buyer"
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirección de seguridad y roles
  useEffect(() => {
    if (!isUserLoading && mounted) {
      if (!user) {
        router.push(role === 'admin' ? '/auth/admin-login' : '/auth/login');
        return;
      }

      const isUserAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Prioridad absoluta al admin: si es admin, entra a su panel
      if (isUserAdmin && role !== 'admin') {
        router.push('/dashboard/admin');
        return;
      }

      // Si no es admin e intenta entrar a panel admin, lo mandamos a login
      if (!isUserAdmin && role === 'admin') {
        router.push('/auth/admin-login');
        return;
      }
    }
  }, [user, isUserLoading, router, role, mounted]);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    const isUserAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isUserAdmin) return null;
    
    const collectionName = role === 'buyer' ? 'buyers' : 'affiliates';
    return doc(db, collectionName, user.uid);
  }, [db, user, role]);

  const { data: profile } = useDoc(profileRef);

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const adminItems = [
    { title: t.overview, url: "/dashboard/admin", icon: LayoutDashboard },
    { title: t.products, url: "/dashboard/admin/products", icon: Package },
    { title: t.affiliateDirectory, url: "/dashboard/admin/affiliates", icon: Users },
    { title: t.affiliateGmailList, url: "/dashboard/admin/affiliates-contacts", icon: Mail },
    { title: t.buyers, url: "/dashboard/admin/buyers", icon: Users2 },
    { title: t.allSales, url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: t.design, url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: t.dashboard, url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: "Marketplace", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: "IA Sales Copilot", url: "/dashboard/affiliate/sales-copilot", icon: MessageSquare },
    { title: "Bot WhatsApp", url: "/dashboard/affiliate/bot-settings", icon: ShieldCheck },
    { title: t.registerSale, url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: t.buyers, url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Mi Perfil / Pagos", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const buyerItems = [
    { title: t.dashboard, url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: t.browseMarketplace, url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const getMenu = () => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return adminItems;
    if (role === 'buyer') return buyerItems;
    return affiliateItems;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const isUserAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  // Pantalla de espera para afiliados pendientes (Excepto Admin)
  if (role === 'affiliate' && profile?.status === 'Pending' && !isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8">
          <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner mx-auto">
            <Clock className="h-12 w-12 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">{t.waitingApproval}</h1>
            <p className="text-slate-500 font-medium leading-relaxed">{t.waitingApprovalMsg}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest border-slate-200">
            {t.logout}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-slate-100">
        <SidebarHeader className="bg-white">
          <div className="flex items-center gap-4 px-3 py-8">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 flex items-center justify-center">
              {displayLogoUrl ? (
                <Image src={displayLogoUrl} alt="Logo" fill className="object-contain p-2" unoptimized />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
              )}
            </div>
            <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-black text-lg tracking-tight text-slate-900">Sync <span className="text-primary">Connect</span></span>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="h-2 w-2 text-primary" />
                <span className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-black">
                  {isUserAdmin ? 'SYSTEM' : (role === 'buyer' ? 'CLIENT' : 'PLATINUM')}
                </span>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-white px-2">
          <NavMain 
            items={getMenu()} 
            label={isUserAdmin ? "ADMINISTRACIÓN" : (role === 'buyer' ? 'TU CUENTA' : 'TU NEGOCIO')} 
          />
        </SidebarContent>
        <SidebarFooter className="bg-white border-t border-slate-50 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="h-12 rounded-xl text-slate-500 hover:text-primary transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="font-black uppercase text-[11px] tracking-widest">{t.logout}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="bg-[#F8FAFC]">
        <header className="flex h-20 shrink-0 items-center gap-2 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-6">
          <SidebarTrigger className="-ml-1 text-primary" />
          <Separator orientation="vertical" className="mx-2 h-6 bg-slate-100" />
          <div className="flex-1">
             <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                {isUserAdmin ? "Centro de Control" : (role === 'buyer' ? 'Área de Compras' : 'Workspace Afiliado')}
             </h2>
          </div>
          <LanguageToggle />
        </header>
        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
