"use client"

import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Users,
  BadgeDollarSign,
  LogOut,
  ShoppingBag,
  Palette,
  User as UserIcon,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import placeholderData from "@/app/lib/placeholder-images.json"

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

interface DashboardShellProps {
  children: React.ReactNode
  role: "admin" | "affiliate"
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const logoImage = placeholderData.placeholderImages.find(img => img.id === 'site-logo');

  // Redirigir si no está autenticado
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
            {logoImage ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border bg-white shadow-sm">
                <Image 
                  src={logoImage.imageUrl} 
                  alt="Logo AffiliateSync" 
                  width={40} 
                  height={40} 
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <ShoppingBag className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-bold text-base tracking-tight text-primary">AffiliateSync</span>
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarImage src={profile.photoUrl} className="object-cover" />
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
          <SidebarTrigger className="-ml-1" />
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