
"use client"

import * as React from "react"
import { useEffect } from "react"
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
  MessageSquare,
  Image as ImageIcon,
  Flame,
  ShoppingBasket,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavMain } from "@/components/dashboard/nav-main"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/components/language-context"
import { LanguageToggle } from "@/components/language-toggle"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import placeholderData from "@/app/lib/placeholder-images.json"
import { getGoogleDriveDirectLink } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
  role: "admin" | "affiliate" | "buyer"
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();

  // Fetch Live Logo
  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(role === 'admin' ? '/auth/admin-login' : '/auth/login');
    }
  }, [user, isUserLoading, router, role]);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    const collectionName = role === 'buyer' ? 'buyers' : 'affiliates';
    return doc(db, collectionName, user.uid);
  }, [db, user, role]);

  const { data: profile } = useDoc(profileRef);

  const adminItems = [
    { title: t.overview, url: "/dashboard/admin", icon: LayoutDashboard },
    { title: t.products, url: "/dashboard/admin/products", icon: Package },
    { title: t.affiliateDirectory, url: "/dashboard/admin/affiliates", icon: Users },
    { title: t.buyers, url: "/dashboard/admin/buyers", icon: Users2 },
    { title: t.allSales, url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: t.design, url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: t.dashboard, url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: "Marketplace", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: t.registerSale, url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: t.buyers, url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: t.botSettings, url: "/dashboard/affiliate/bot-settings", icon: MessageSquare },
  ]

  const buyerItems = [
    { title: t.dashboard, url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: t.browseMarketplace, url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const getMenu = () => {
    if (role === 'admin') return adminItems;
    if (role === 'buyer') return buyerItems;
    return affiliateItems;
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-slate-100">
        <SidebarHeader className="bg-white">
          <div className="flex items-center gap-4 px-3 py-8">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-xl shadow-primary/5 ring-1 ring-slate-100 flex items-center justify-center">
              {displayLogoUrl ? (
                <Image 
                  src={displayLogoUrl} 
                  alt="Logo" 
                  fill 
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
              )}
            </div>
            <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-black text-lg tracking-tight text-slate-900">Sync <span className="text-primary">Connect</span></span>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="h-2 w-2 text-primary" />
                <span className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-black">{role === 'buyer' ? 'CLIENT' : 'PLATINUM'}</span>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-white px-2">
          <NavMain 
            items={getMenu()} 
            label={role === "admin" ? "ADMINISTRACIÓN" : (role === 'buyer' ? 'TU CUENTA' : 'TU NEGOCIO')} 
          />
        </SidebarContent>
        <SidebarFooter className="bg-white border-t border-slate-50 p-4">
          <SidebarMenu>
            {profile && (
              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden mb-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                    <AvatarImage src={getGoogleDriveDirectLink(profile.photoUrl)} className="object-cover" />
                    <AvatarFallback className="bg-primary text-xs text-white font-black">
                      {profile.firstName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-black truncate text-slate-900 uppercase tracking-tight">{profile.firstName} {profile.lastName}</span>
                    <span className="text-[10px] text-slate-400 font-bold truncate lowercase">{profile.email}</span>
                  </div>
                </div>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-12 rounded-xl text-slate-500 hover:text-primary transition-colors">
                <a href="/">
                  <LogOut className="h-5 w-5" />
                  <span className="font-black uppercase text-[11px] tracking-widest">{t.logout}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="bg-[#F8FAFC]">
        <header className="flex h-20 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-6">
          <SidebarTrigger className="-ml-1 text-primary hover:bg-primary/5 transition-colors" />
          <Separator orientation="vertical" className="mx-2 h-6 bg-slate-100" />
          <div className="flex-1">
             <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                {role === 'admin' ? "Centro de Control" : (role === 'buyer' ? 'Área de Compras' : 'Workspace Afiliado')}
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <LanguageToggle />
          </div>
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
