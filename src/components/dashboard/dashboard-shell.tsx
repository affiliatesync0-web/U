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
  Image as ImageIcon,
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
  role: "admin" | "affiliate"
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
    if (!db || !user || role !== 'affiliate') return null;
    return doc(db, 'affiliates', user.uid);
  }, [db, user, role]);

  const { data: profile } = useDoc(profileRef);

  const adminItems = [
    { title: t.overview, url: "/dashboard/admin", icon: LayoutDashboard },
    { title: t.products, url: "/dashboard/admin/products", icon: Package },
    { title: t.affiliateDirectory, url: "/dashboard/admin/affiliates", icon: Users },
    { title: t.allSales, url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: t.design, url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: t.dashboard, url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: t.products, url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: t.registerSale, url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: t.buyers, url: "/dashboard/affiliate/buyers", icon: Users2 },
  ]

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-6">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white shadow-md border flex items-center justify-center">
              {displayLogoUrl ? (
                <Image 
                  src={displayLogoUrl} 
                  alt="Logo" 
                  fill 
                  className="object-contain p-1"
                  unoptimized
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-bold text-base tracking-tight text-slate-900">Sync <span className="text-primary">Connect</span></span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Network</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain 
            items={role === "admin" ? adminItems : affiliateItems} 
            label={role === "admin" ? t.adminLogin : t.affiliatePortal} 
          />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {role === 'affiliate' && profile && (
              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden px-2 mb-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-slate-200">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarImage src={getGoogleDriveDirectLink(profile.photoUrl)} className="object-cover" />
                    <AvatarFallback className="bg-primary text-xs text-white font-bold">
                      {profile.firstName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold truncate text-slate-900">{profile.firstName} {profile.lastName}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{profile.email}</span>
                  </div>
                </div>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/">
                  <LogOut />
                  <span>{t.logout}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30 px-4">
          <SidebarTrigger className="-ml-1 text-primary" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
             <h2 className="text-sm font-bold capitalize text-primary tracking-tight">
                {role === 'admin' ? t.adminLogin : t.affiliatePortal}
             </h2>
          </div>
          <LanguageToggle />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
