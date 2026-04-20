
"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
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
  Inbox,
  GraduationCap,
  Sparkles,
  Smartphone,
  Terminal,
  Cpu,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Globe
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import placeholderData from "@/app/lib/placeholder-images.json"
import { getGoogleDriveDirectLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardShellProps {
  children: React.ReactNode
  role: "admin" | "affiliate" | "buyer"
}

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

export function DashboardShell({ children, role }: DashboardShellProps) {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();
  const auth = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [isVerifyingRole, setIsVerifyingRole] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cleanEmail = user?.email?.toLowerCase().trim() || '';
  const isUserAdmin = cleanEmail === ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function verifyAccess() {
      if (!mounted || isUserLoading) return;

      if (!user) {
        window.location.href = '/auth/login';
        return;
      }

      if (isUserAdmin) {
        if (!pathname.startsWith('/dashboard/admin')) {
          window.location.href = '/dashboard/admin'; 
          return;
        }
        setIsVerifyingRole(false);
        return;
      }

      if (!isUserAdmin && pathname.startsWith('/dashboard/admin')) {
        window.location.href = '/dashboard/affiliate'; 
        return;
      }

      try {
        const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
        const isAffiliate = affSnap.exists();
        
        if (role === 'affiliate' && !isAffiliate && !isUserAdmin) {
          router.replace('/dashboard/buyer');
          return;
        }
      } catch (err) {
        console.error("Access verification error:", err);
      } finally {
        setIsVerifyingRole(false);
      }
    }

    verifyAccess();
  }, [user, isUserLoading, mounted, pathname, isUserAdmin, router, role, db]);

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

  if (!mounted || isUserLoading || isVerifyingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
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

  if (isUserAdmin && !pathname.startsWith('/dashboard/admin')) return null;
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
    { title: "Productos", url: "/dashboard/admin/products", icon: Package },
    { title: "Build Center", url: "/dashboard/admin/releases", icon: Terminal },
    { title: "Estrategias Lab", url: "/dashboard/admin/sales-lab", icon: Zap },
    { title: "Directorio Socios", url: "/dashboard/admin/affiliates", icon: Users },
    { title: "Mapa de Red", url: "/dashboard/admin/map", icon: MapPin },
    { title: "Compradores", url: "/dashboard/admin/buyers", icon: Users2 },
    { title: "Ventas", url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: "Diseño", url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: "Panel", url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: "Mi Buzón", url: "/dashboard/affiliate/support", icon: Mail },
    { title: "Descargar App", url: "/dashboard/affiliate/downloads", icon: Smartphone },
    { title: "Marketplace", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: "Bot de Ventas", url: "/dashboard/affiliate/bot-settings", icon: Zap },
    { title: "AI Site Builder", url: "/dashboard/affiliate/site-builder", icon: Globe },
    { title: "Sales Lab", url: "/dashboard/affiliate/sales-lab", icon: Flame },
    { title: "Copiloto IA", url: "/dashboard/affiliate/sales-copilot", icon: Sparkles },
    { title: "Registrar Venta", url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: "Mis Clientes", url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Billetera", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const buyerItems = [
    { title: "Panel de Control", url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: "Productos", url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const menuItems = isUserAdmin ? adminItems : (role === 'buyer' ? buyerItems : affiliateItems);
  const roleLabel = isUserAdmin ? 'ENGINEER' : (role === 'buyer' ? 'STUDENT' : 'PARTNER');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      {/* TOP NAVIGATION BAR (AMAZON STYLE) */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-all h-20 md:h-24">
        <div className="container mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
              <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-100 dark:ring-slate-700 flex items-center justify-center">
                {displayLogoUrl ? (
                  <Image src={displayLogoUrl} alt="Logo" fill className="object-contain p-1.5" unoptimized />
                ) : (
                  <Terminal className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-headline font-black text-lg md:text-xl tracking-tighter text-slate-900 dark:text-white uppercase italic">Sync <span className="text-primary">Connect</span></span>
                <Badge className="w-fit bg-primary/10 text-primary border-none text-[7px] font-black uppercase tracking-widest px-1.5 py-0 mt-0.5">
                  {roleLabel}
                </Badge>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 px-8">
            <div className="h-10 w-[2px] bg-slate-100 dark:bg-slate-800 mx-4" />
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              {menuItems.map((item) => (
                <Link 
                  key={item.url} 
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                    pathname === item.url 
                      ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-1 mr-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-primary font-black text-xs shadow-lg group-hover:rotate-3 transition-transform">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col text-left mr-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Cuenta</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[100px]">Mi Sync</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-none shadow-2xl bg-white dark:bg-slate-900">
                <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-4 pt-3 pb-2">Gestión de Perfil</DropdownMenuLabel>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-slate-50 dark:focus:bg-slate-800">
                   <Link href="/dashboard/affiliate/profile" className="flex items-center gap-3 p-3 font-bold text-xs">
                     <UserCircle className="h-4 w-4 text-primary" /> Mi Billetera
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-2" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl focus:bg-red-50 dark:focus:bg-red-950/20 text-red-500 p-3 font-bold text-xs gap-3">
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Trigger */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={cn(
          "lg:hidden fixed inset-0 top-20 z-40 bg-white dark:bg-slate-950 transition-all duration-500 ease-in-out transform",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-6 space-y-8 h-full overflow-y-auto pb-32">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Navegación</p>
              <div className="grid grid-cols-1 gap-2">
                {menuItems.map((item) => (
                  <Link 
                    key={item.url} 
                    href={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all",
                      pathname === item.url 
                        ? "bg-slate-900 text-white shadow-2xl" 
                        : "text-slate-500 bg-slate-50 dark:bg-slate-900/50"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg",
                      pathname === item.url ? "bg-primary text-white" : "bg-white dark:bg-slate-800"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t dark:border-slate-800 flex items-center justify-between px-4">
              <div className="flex gap-2">
                <ThemeToggle />
                <LanguageToggle />
              </div>
              <Button onClick={handleLogout} variant="ghost" className="text-red-500 font-black text-[10px] uppercase gap-2">
                <LogOut className="h-4 w-4" /> SALIR
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* FOOTER SIMPLE (OPCIONAL) */}
      <footer className="py-10 px-8 border-t border-slate-100 dark:border-slate-900 text-center">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Sync Connect Technology • © 2024</p>
      </footer>
    </div>
  )
}
