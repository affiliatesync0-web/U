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
  ShoppingBag,
  Palette,
  Users2,
  Flame,
  ShoppingBasket,
  UserCircle,
  Menu,
  X,
  Search,
  ChevronDown,
  ShoppingCart,
  LogOut,
  Terminal,
  Zap,
  Settings,
  ShieldCheck,
  User as UserIcon,
  CreditCard,
  ChevronRight,
  MessageCircle,
  MessageSquare
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function verifyAccess() {
      if (!mounted || isUserLoading) return;
      if (!user) { window.location.href = '/auth/login'; return; }

      if (isUserAdmin) {
        if (!pathname.startsWith('/dashboard/admin')) { router.push('/dashboard/admin'); }
        setIsVerifyingRole(false);
        return;
      }

      if (pathname.startsWith('/dashboard/admin')) { router.push('/dashboard/affiliate'); return; }

      try {
        const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
        if (role === 'affiliate' && !affSnap.exists() && !isUserAdmin) {
          router.replace('/dashboard/buyer');
        }
      } catch (err) { console.error(err); } finally { setIsVerifyingRole(false); }
    }
    verifyAccess();
  }, [user, isUserLoading, mounted, pathname, isUserAdmin, router, role, db]);

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    window.location.href = '/auth/login';
  }

  if (!mounted || isUserLoading || isVerifyingRole) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
  }

  const adminItems = [
    { title: "Resumen", url: "/dashboard/admin", icon: LayoutDashboard },
    { title: "Buzón Maestro", url: "/dashboard/admin/support", icon: MessageSquare },
    { title: "Productos", url: "/dashboard/admin/products", icon: Package },
    { title: "Build Center", url: "/dashboard/admin/releases", icon: Terminal },
    { title: "Estrategias Lab", url: "/dashboard/admin/sales-lab", icon: Zap },
    { title: "Ventas", url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: "Diseño & Config", url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: "Panel", url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: "Buzón Privado", url: "/dashboard/affiliate/support", icon: MessageCircle },
    { title: "Marketplace", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: "Sales Lab", url: "/dashboard/affiliate/sales-lab", icon: Flame },
    { title: "Mis Clientes", url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Perfil de Cobros", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const buyerItems = [
    { title: "Mis Pedidos", url: "/dashboard/buyer", icon: LayoutDashboard },
    { title: "Explorar Marketplace", url: "/dashboard/buyer/products", icon: ShoppingBasket },
  ]

  const menuItems = isUserAdmin ? adminItems : (role === 'buyer' ? buyerItems : affiliateItems);

  return (
    <div className="min-h-screen bg-[#EAEDED] flex flex-col">
      <header className="sticky top-0 z-[100] w-full flex flex-col shadow-md bg-[#131921]">
        <div className="h-[60px] md:h-[72px] flex items-center px-4 gap-4">
          <Link href={isUserAdmin ? "/dashboard/admin" : (role === 'buyer' ? "/dashboard/buyer" : "/dashboard/affiliate")} className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white shrink-0">
            <div className="relative h-8 w-24 md:h-10 md:w-32">
              {displayLogoUrl ? (
                <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
              ) : (
                <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
              )}
            </div>
          </Link>

          <div className="flex-1 flex h-10 md:h-11 items-center mx-4 group">
            <div className="flex-1 flex h-full bg-white rounded-md overflow-hidden focus-within:ring-[3px] focus-within:ring-[#FF9900]">
              <Input placeholder="Buscar en Sync..." className="flex-1 border-none focus-visible:ring-0 text-[15px] h-full px-4" />
              <button className="bg-[#FEBD69] hover:bg-[#F3A847] w-12 md:w-14 h-full flex items-center justify-center"><Search className="h-6 w-6 text-[#333]" /></button>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-start p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left transition-all">
                  <span className="text-[#CCCCCC] text-[11px] font-bold uppercase tracking-wider">Hola, {isUserAdmin ? 'Admin' : (user?.displayName?.split(' ')[0] || 'Usuario')}</span>
                  <div className="flex items-center text-white font-black text-[14px]">Mi Cuenta <ChevronDown className="h-3 w-3 ml-1 text-[#CCCCCC]" /></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] border-none rounded-2xl overflow-hidden mt-2">
                <DropdownMenuLabel className="p-6 bg-slate-50 border-b">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-slate-900 truncate">{user?.displayName || 'Usuario Sync'}</span>
                        <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{user?.email}</span>
                      </div>
                   </div>
                </DropdownMenuLabel>
                
                <div className="p-3">
                   {menuItems.map((item) => (
                     <DropdownMenuItem key={item.url} asChild className="p-0 mb-1 focus:bg-transparent">
                        <Link 
                          href={item.url} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl transition-all group",
                            pathname === item.url ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                               pathname === item.url ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md"
                             )}>
                                <item.icon className="h-4.5 w-4.5" />
                             </div>
                             <span className="text-[13px] font-black uppercase tracking-tight">{item.title}</span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", pathname === item.url ? "text-primary" : "text-slate-300")} />
                        </Link>
                     </DropdownMenuItem>
                   ))}
                </div>

                <DropdownMenuSeparator className="m-0 bg-slate-100" />
                
                <div className="p-4 bg-slate-50/50">
                  <Button 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 group" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 text-primary group-hover:text-white transition-colors" /> CERRAR SESIÓN
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="relative p-2 hidden sm:block">
              <ShoppingCart className="h-9 w-9 text-white" />
              <span className="absolute top-0 right-0 text-[#FF9900] font-black bg-[#131921] px-1 rounded-sm text-xs">0</span>
            </div>
          </div>
        </div>

        <div className="bg-[#232F3E] h-[39px] flex items-center px-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white font-black text-[14px] flex items-center gap-1 mr-4 shrink-0"><Menu className="h-5 w-5" /> Todo</button>
          <div className="flex items-center gap-1">
            {menuItems.map((item) => (
              <Link key={item.url} href={item.url} className={cn("px-4 py-2 text-white text-[13px] whitespace-nowrap transition-all hover:bg-white/5 rounded-md", pathname === item.url ? "font-black" : "font-medium")}>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-all" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="relative w-[300px] bg-white h-full animate-in slide-in-from-left duration-300">
              <div className="bg-[#232F3E] p-6 flex items-center justify-between text-white shadow-xl">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-black uppercase tracking-tighter">Sync Navigation</span>
                 </div>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="hover:rotate-90 transition-transform"><X className="h-6 w-6" /></button>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)] p-6">
                 <div className="space-y-1">
                   {menuItems.map((item) => (
                     <Link 
                      key={item.url} 
                      href={item.url} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                        "flex items-center gap-4 py-4 px-4 rounded-xl font-black uppercase text-xs transition-all",
                        pathname === item.url ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                       <item.icon className="h-5 w-5" /> {item.title}
                     </Link>
                   ))}
                 </div>
              </ScrollArea>
           </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-10 max-w-[1500px] mx-auto w-full">{children}</main>

      <footer className="bg-[#131A22] text-white py-10 border-t-8 border-[#232F3E] text-center">
         <span className="font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
         <p className="text-[11px] text-[#888] mt-2 tracking-widest uppercase">© 2024 Nicaragua Elite Network Engine.</p>
      </footer>
    </div>
  )
}
