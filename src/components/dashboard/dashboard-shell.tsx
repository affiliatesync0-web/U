
"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  Users,
  BadgeDollarSign,
  LogOut,
  ShoppingBag,
  Target,
  Palette,
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

interface DashboardShellProps {
  children: React.ReactNode
  role: "admin" | "affiliate"
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const { t } = useLanguage();

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

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-bold text-sm tracking-tight text-primary">{t.brand}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Connect</span>
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
             <h2 className="text-sm font-semibold capitalize text-muted-foreground">
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
