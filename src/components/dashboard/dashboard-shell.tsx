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
  ShieldCheck,
  UserCircle,
  Zap,
  Inbox,
  GraduationCap,
  Terminal,
  Menu,
  X,
  Search,
  ChevronDown,
  Globe,
  ShoppingCart,
  MapPin
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
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

  const buyerRef = useMemoFirebase(() => (db && user && role === 'buyer' ? doc(db, 'buyers', user.uid) : null), [db, user, role]);
  const { data: buyerProfile } = useDoc(buyerRef);

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.href = '/auth/login';
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/auth/login';
    }
  }

  const getDisplayName = () => {
    if (isUserAdmin) return "Admin";
    if (affiliateProfile?.firstName) return affiliateProfile.firstName;
    if (buyerProfile?.firstName) return buyerProfile.firstName;
    if (user?.displayName) return user.displayName.split(' ')[0];
    return "Invitado";
  };

  const displayName = getDisplayName();

  if (!mounted || isUserLoading || isVerifyingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131921]">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 border-4 border-[#FF9900]/10 border-t-[#FF9900] rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Sincronizando...</p>
        </div>
      </div>
    )
  }

  const adminItems = [
    { title: t.overview, url: "/dashboard/admin", icon: LayoutDashboard },
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
    { title: "Marketplace", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: "Sales Lab", url: "/dashboard/affiliate/sales-lab", icon: Flame },
    { title: t.registerSale, url: "/dashboard/affiliate/register-sale", icon: BadgeDollarSign },
    { title: t.myCustomers, url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Billetera", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const buyerItems = [
    { title: "Panel de Control", url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: "Productos", url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const menuItems = isUserAdmin ? adminItems : (role === 'buyer' ? buyerItems : affiliateItems);
  const profileUrl = isUserAdmin ? "/dashboard/admin/design" : (role === 'buyer' ? "/dashboard/buyer" : "/dashboard/affiliate/profile");
  const marketUrl = isUserAdmin ? "/dashboard/admin/products" : (role === 'buyer' ? "/dashboard/buyer/products" : "/dashboard/affiliate/products");

  return (
    <div className="min-h-screen bg-[#EAEDED] flex flex-col">
      <header className="sticky top-0 z-[100] w-full flex flex-col shadow-md">
        <div className="bg-[#131921] h-[60px] md:h-[72px] flex items-center px-4 gap-4">
          <Link href={isUserAdmin ? "/dashboard/admin" : (role === 'buyer' ? "/dashboard/buyer" : "/dashboard/affiliate")} className="flex items-center p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white shrink-0">
            <div className="relative h-8 w-24 md:h-10 md:w-32">
              {displayLogoUrl ? (
                <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
              ) : (
                <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
              )}
            </div>
          </Link>

          <div className="hidden xl:flex items-center p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white cursor-pointer shrink-0">
             <MapPin className="h-5 w-5 text-white mt-1" />
             <div className="flex flex-col ml-1">
                <span className="text-[#CCCCCC] text-[12px] leading-tight">Enviar a</span>
                <span className="text-white text-[14px] font-black leading-tight">Nicaragua</span>
             </div>
          </div>

          <div className="flex-1 flex h-10 md:h-11 items-center mx-4 group">
            <div className="flex-1 flex h-full bg-white rounded-md overflow-hidden ring-offset-0 focus-within:ring-[3px] focus-within:ring-[#FF9900] transition-shadow">
              <button className="hidden md:flex items-center px-4 bg-[#F3F3F3] text-[#555] text-[12px] border-r border-[#CDCDCD] hover:bg-[#DADADA] font-bold uppercase">
                Todo <ChevronDown className="h-3 w-3 ml-2" />
              </button>
              <Input 
                placeholder="Buscar en Sync Connect..." 
                className="flex-1 border-none focus-visible:ring-0 text-[15px] h-full rounded-none bg-transparent px-4 font-medium text-slate-800" 
              />
              <button className="bg-[#FEBD69] hover:bg-[#F3A847] w-12 md:w-14 h-full flex items-center justify-center transition-colors">
                <Search className="h-6 w-6 text-[#333333]" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-start p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white cursor-pointer text-left">
                  <span className="text-white text-[12px] leading-tight">Hola, {displayName}</span>
                  <div className="flex items-center">
                    <span className="text-white font-black text-[14px] leading-tight">Cuenta y Listas</span>
                    <ChevronDown className="h-3 w-3 text-[#CCCCCC] ml-1" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-md p-6 border-none shadow-2xl bg-white mt-1">
                <div className="flex flex-col gap-4">
                  <Button className="amazon-btn-primary w-full" asChild>
                    <Link href={profileUrl}>Panel Maestro</Link>
                  </Button>
                </div>
                <DropdownMenuSeparator className="my-5" />
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <DropdownMenuLabel className="p-0 text-sm font-black mb-2">Tus Listas</DropdownMenuLabel>
                    <Link href="#" className="text-[13px] text-[#444] hover:text-[#C45500] hover:underline block">Mis Cursos</Link>
                    <Link href="#" className="text-[13px] text-[#444] hover:text-[#C45500] hover:underline block">Mis Favoritos</Link>
                  </div>
                  <div className="space-y-2">
                    <DropdownMenuLabel className="p-0 text-sm font-black mb-2">Tu Cuenta</DropdownMenuLabel>
                    <Link href={profileUrl} className="text-[13px] text-[#444] hover:text-[#C45500] hover:underline block">Mi Perfil</Link>
                    <Link href={marketUrl} className="text-[13px] text-[#444] hover:text-[#C45500] hover:underline block">Mis Pedidos</Link>
                    <button onClick={handleLogout} className="text-[13px] text-[#C45500] hover:underline text-left py-1 font-bold w-full">Cerrar Sesión</button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href={marketUrl} className="hidden md:flex flex-col items-start p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left">
               <span className="text-white text-[12px] leading-tight">Devoluciones</span>
               <span className="text-white font-black text-[14px] leading-tight">y Pedidos</span>
            </Link>

            <Link href={marketUrl} className="flex items-end p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white relative">
               <div className="relative">
                 <ShoppingCart className="h-9 w-9 text-white" />
                 <span className="absolute top-[-2px] left-[55%] -translate-x-1/2 text-[#FF9900] font-black text-[16px] leading-none">0</span>
               </div>
               <span className="text-white font-black text-[14px] mb-1.5 hidden sm:inline ml-1">Market</span>
            </Link>
          </div>
        </div>

        <div className="bg-[#232F3E] h-[39px] flex items-center px-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex items-center gap-1.5 p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-white font-black text-[14px] whitespace-nowrap mr-3">
            <Menu className="h-5 w-5" /> Todo
          </button>
          <nav className="flex items-center h-full gap-4">
             {menuItems.slice(0, 8).map((item) => (
               <Link key={item.url} href={item.url} className={cn("px-3 h-full flex items-center rounded-sm hover:outline hover:outline-1 hover:outline-white text-white text-[14px] whitespace-nowrap transition-all", pathname === item.url ? "font-black" : "font-medium")}>
                 {item.title}
               </Link>
             ))}
          </nav>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="relative w-[300px] md:w-[365px] bg-white h-full flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
              <div className="bg-[#232F3E] p-5 flex items-center gap-4 text-white">
                 <UserCircle className="h-8 w-8" />
                 <span className="text-xl font-black tracking-tight">Hola, {displayName}</span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto hover:scale-110 transition-transform"><X className="h-6 w-6" /></button>
              </div>
              <ScrollArea className="flex-1 p-6">
                 <h4 className="text-lg font-black mb-4 text-[#111] uppercase tracking-tighter">Navegar por Sync</h4>
                 <div className="flex flex-col gap-2">
                    {menuItems.map((item) => (
                      <Link key={item.url} href={item.url} onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center justify-between py-3 border-b border-slate-50 hover:bg-slate-50 px-2 rounded-sm transition-colors", pathname === item.url ? "bg-slate-50 border-primary" : "")}>
                        <div className="flex items-center gap-3">
                          {item.icon && <item.icon className={cn("h-4 w-4", pathname === item.url ? "text-primary" : "text-slate-400")} />}
                          <span className={cn("text-[14px] font-medium", pathname === item.url ? "font-black text-slate-900" : "text-[#111]")}>{item.title}</span>
                        </div>
                      </Link>
                    ))}
                 </div>
              </ScrollArea>
           </div>
        </div>
      )}

      <main className="flex-1">
        <div className="max-w-[1500px] mx-auto p-4 md:p-10">
          {children}
        </div>
      </main>

      <footer className="bg-[#131A22] text-white pt-10 pb-10 border-t-8 border-[#232F3E]">
         <div className="text-center py-10 border-t border-white/5 space-y-4">
            <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            <p className="text-[11px] text-[#888]">© 2024 Sync Connect Nicaragua. Una infraestructura de Sync Academy.</p>
         </div>
      </footer>
    </div>
  )
}
