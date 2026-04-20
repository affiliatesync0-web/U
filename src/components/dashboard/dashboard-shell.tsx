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
  Menu,
  X,
  Search,
  ChevronDown,
  Globe,
  ShoppingCart
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import placeholderData from "@/app/lib/placeholder-images.json"
import { getGoogleDriveDirectLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

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
      <div className="min-h-screen flex items-center justify-center bg-[#131921]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-[6px] border-[#FF9900]/10 border-t-[#FF9900] animate-spin" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-[#FF9900]/30" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#CCCCCC] animate-pulse">Sincronizando Identidad</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#FF9900]">Sync Connect v2.0</p>
          </div>
        </div>
      </div>
    )
  }

  if (isUserAdmin && !pathname.startsWith('/dashboard/admin')) return null;
  if (!user) return null;

  if (role === 'affiliate' && affiliateProfile?.status === 'Pending' && !isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-6 text-center text-foreground">
        <div className="max-w-md space-y-10 animate-in fade-in zoom-in duration-700">
          <div className="h-32 w-32 bg-primary/10 rounded-[3.5rem] flex items-center justify-center text-primary shadow-2xl mx-auto rotate-3 group">
            <Clock className="h-16 w-16 animate-pulse group-hover:rotate-12 transition-transform" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-headline font-black tracking-tight leading-none uppercase italic">Estatus: <span className="text-primary">En Revisión</span></h1>
            <p className="text-slate-500 font-medium leading-relaxed mt-6">Tu perfil está siendo auditado por el equipo legal. Recibirás un Gmail de confirmación cuando tu licencia Platinum sea habilitada.</p>
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
    { title: t.registerSale, url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: t.myCustomers, url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Billetera", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const buyerItems = [
    { title: "Panel de Control", url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: "Productos", url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const menuItems = isUserAdmin ? adminItems : (role === 'buyer' ? buyerItems : affiliateItems);
  const roleLabel = isUserAdmin ? 'ADMIN MASTER' : (role === 'buyer' ? 'STUDENT' : 'PARTNER');
  
  const marketUrl = isUserAdmin ? "/dashboard/admin/products" : (role === 'buyer' ? "/dashboard/buyer/products" : "/dashboard/affiliate/products");
  const profileUrl = isUserAdmin ? "/dashboard/admin/design" : (role === 'buyer' ? "/dashboard/buyer" : "/dashboard/affiliate/profile");

  return (
    <div className="min-h-screen bg-[#EAEDED] flex flex-col font-body">
      {/* AMAZON MASTER HEADER */}
      <header className="sticky top-0 z-50 w-full flex flex-col shrink-0 shadow-md">
        
        {/* ROW 1: DARK NAVY BAR */}
        <div className="bg-[#131921] h-[60px] md:h-[72px] flex items-center px-2 md:px-4 gap-1 md:gap-4">
          
          {/* Logo & Role */}
          <Link href={isUserAdmin ? "/dashboard/admin" : (role === 'buyer' ? "/dashboard/buyer" : "/dashboard/affiliate")} className="flex items-center p-2 rounded hover:outline hover:outline-1 hover:outline-white shrink-0">
            <div className="relative h-7 w-7 md:h-9 md:w-9 mr-1">
              {displayLogoUrl ? (
                <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
              ) : (
                <Terminal className="h-full w-full text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-sm md:text-xl tracking-tighter leading-none italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
              <span className="text-[#FF9900] text-[8px] font-bold text-right uppercase tracking-[0.2em]">{roleLabel}</span>
            </div>
          </Link>

          {/* Location Selector (Deliver to) */}
          <div className="hidden xl:flex items-center p-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer group shrink-0">
             <MapPin className="h-5 w-5 text-white mt-1.5" />
             <div className="flex flex-col ml-1">
                <span className="text-[#CCCCCC] text-[12px] leading-none">Entregar en</span>
                <span className="text-white text-[14px] font-black leading-tight">Nicaragua</span>
             </div>
          </div>

          {/* Search Bar (Amazon Style) */}
          <div className="flex-1 flex h-10 md:h-11 items-center mx-1 md:mx-4">
            <div className="flex-1 flex h-full bg-white rounded-md overflow-hidden focus-within:ring-[3px] focus-within:ring-[#FF9900]">
              <button className="hidden md:flex items-center px-4 bg-[#F3F3F3] text-[#555555] text-[12px] border-r border-[#CDCDCD] hover:bg-[#DADADA] transition-colors font-medium">
                Sync <ChevronDown className="h-3 w-3 ml-2" />
              </button>
              <Input 
                placeholder="Buscar herramientas y productos..." 
                className="flex-1 border-none focus-visible:ring-0 text-[15px] h-full rounded-none bg-transparent px-4 font-medium" 
              />
              <button className="bg-[#FEBD69] hover:bg-[#F3A847] w-12 md:w-14 h-full flex items-center justify-center transition-colors">
                <Search className="h-6 w-6 text-[#333333]" />
              </button>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-0 md:gap-1 shrink-0">
            
            {/* Account & Lists */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-start p-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer group text-left">
                  <span className="text-white text-[12px] leading-none">Hola, {profileLabel(user?.email || 'Socio')}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-black text-[14px] leading-tight tracking-tight">Cuenta y Listas</span>
                    <ChevronDown className="h-3 w-3 text-[#CCCCCC]" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl p-5 border-none shadow-2xl bg-white mt-1">
                <div className="flex flex-col gap-3">
                  <Button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black font-medium text-xs rounded-lg h-10 shadow-sm border border-[#F2C200]" asChild>
                    <Link href={profileUrl}>Entrar a Mi Panel</Link>
                  </Button>
                </div>
                <DropdownMenuSeparator className="my-5" />
                <div className="grid grid-cols-1 gap-2">
                  <DropdownMenuLabel className="p-0 text-sm font-black mb-1">Mi Ecosistema</DropdownMenuLabel>
                  <Link href={profileUrl} className="text-[13px] text-[#444] hover:text-[#C45500] hover:underline py-0.5">Perfil y Billetera</Link>
                  <Link href={marketUrl} className="text-[13px] text-[#444] hover:text-[#C45500] hover:underline py-0.5">Catálogo de Productos</Link>
                  <DropdownMenuSeparator className="my-2" />
                  <button onClick={handleLogout} className="text-[13px] text-[#C45500] hover:underline text-left py-1 font-bold">Cerrar Sesión</button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Orders Link */}
            <Link href={marketUrl} className="hidden md:flex flex-col items-start p-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer group text-left">
               <span className="text-white text-[12px] leading-none">Mis</span>
               <span className="text-white font-black text-[14px] leading-tight">Pedidos</span>
            </Link>

            {/* Cart Icon (Market) */}
            <Link href={marketUrl} className="flex items-end p-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer group relative">
               <div className="relative">
                 <ShoppingCart className="h-9 w-9 text-white" />
                 <span className="absolute top-[-2px] left-[55%] -translate-x-1/2 text-[#FF9900] font-black text-[16px] leading-none">
                   {(affiliateProfile?.currentBalance > 0) ? '1' : '0'}
                 </span>
               </div>
               <span className="text-white font-black text-[14px] mb-1.5 hidden sm:inline ml-1">Market</span>
            </Link>
          </div>
        </div>

        {/* ROW 2: NAV LIGHT BAR */}
        <div className="bg-[#232F3E] h-[39px] flex items-center px-4 overflow-x-auto no-scrollbar border-t border-white/5">
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-1.5 p-2 rounded hover:outline hover:outline-1 hover:outline-white text-white font-black text-[14px] whitespace-nowrap mr-3"
          >
            <Menu className="h-5 w-5" /> Todo
          </button>

          <nav className="flex items-center h-full gap-2">
             {menuItems.slice(0, 7).map((item) => (
               <Link 
                key={item.url} 
                href={item.url}
                className={cn(
                  "px-3 h-full flex items-center rounded hover:outline hover:outline-1 hover:outline-white text-white text-[14px] whitespace-nowrap transition-all",
                  pathname === item.url ? "font-black" : "font-medium"
                )}
               >
                 {item.title}
               </Link>
             ))}
          </nav>
          
          <div className="ml-auto flex items-center gap-5">
             <div className="hidden md:block transform scale-90">
               <ThemeToggle />
             </div>
             <span className="hidden xl:inline text-white font-black text-[14px] uppercase italic tracking-tighter opacity-80">Sync Academy: <span className="text-[#FF9900]">Estrategia de Élite</span></span>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="relative w-[85%] max-w-[365px] bg-white h-full flex flex-col animate-in slide-in-from-left duration-500 overflow-hidden shadow-2xl">
              <div className="bg-[#232F3E] p-5 flex items-center gap-3 shrink-0">
                 <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-[#232F3E]" />
                 </div>
                 <span className="text-white font-black text-xl">Hola, {profileLabel(user?.email || 'Socio')}</span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto text-white p-2">
                   <X className="h-7 w-7" />
                 </button>
              </div>
              <ScrollArea className="flex-1 py-6">
                 <div className="px-8 space-y-10">
                    <div>
                      <h4 className="text-xl font-black mb-5 text-[#111]">Navegar por Sync</h4>
                      <div className="flex flex-col gap-2">
                        {menuItems.map((item) => (
                          <Link 
                            key={item.url} 
                            href={item.url} 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-4 group border-b border-slate-50 last:border-0"
                          >
                            <span className="text-[15px] text-[#111] group-hover:font-black transition-all">{item.title}</span>
                            <ChevronDown className="h-4 w-4 -rotate-90 text-[#888]" />
                          </Link>
                        ))}
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <div>
                       <h4 className="text-xl font-black mb-5 text-[#111]">Ayuda y Ajustes</h4>
                       <Link href={profileUrl} onClick={() => setIsMobileMenuOpen(false)} className="block py-4 text-[15px] text-[#111]">Configurar mi Cuenta</Link>
                       <button onClick={handleLogout} className="block py-4 text-[15px] w-full text-left text-red-600 font-bold">Cerrar Sesión</button>
                    </div>
                 </div>
              </ScrollArea>
           </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <main className="flex-1 animate-in fade-in duration-700">
        <div className="max-w-[1500px] mx-auto px-4 md:px-10 py-10 md:py-14">
          {children}
        </div>
      </main>

      {/* AMAZON STYLE FOOTER */}
      <footer className="bg-[#131A22] text-white py-16 px-8 text-center border-t-8 border-[#232F3E]">
         <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center mb-8">
               <Terminal className="h-12 w-12 text-[#FF9900]" />
            </div>
            <p className="text-[13px] text-[#CCCCCC] leading-relaxed max-w-lg mx-auto">
              Sync Connect es la infraestructura líder en sincronización de negocios digitales en Nicaragua. Seguridad, rapidez y escala garantizada.
            </p>
            <div className="flex justify-center gap-10 pt-8 flex-wrap">
               <Link href="#" className="text-[12px] text-white hover:underline">Condiciones de Uso</Link>
               <Link href="#" className="text-[12px] text-white hover:underline">Aviso de Privacidad</Link>
               <Link href="#" className="text-[12px] text-white hover:underline">Ayuda de Sync Academy</Link>
            </div>
            <p className="text-[11px] text-[#888] font-bold mt-10">© 2024 Sync Connect Nicaragua. Todos los derechos reservados.</p>
         </div>
      </footer>
    </div>
  )
}

function profileLabel(email: string) {
  if (!email) return 'Socio';
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
