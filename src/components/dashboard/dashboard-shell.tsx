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
  UserCircle,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Terminal,
  Zap,
  MapPin,
  UserCheck,
  GraduationCap
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
      if (!user) { window.location.href = '/'; return; }

      if (isUserAdmin) {
        if (!pathname.startsWith('/dashboard/admin')) { router.push('/dashboard/admin'); }
        setIsVerifyingRole(false);
        return;
      }

      // Los compradores ya no tienen acceso al dashboard
      if (role === 'buyer') {
        await signOut(auth);
        window.location.href = '/';
        return;
      }

      try {
        if (db) {
          const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
          if (!affSnap.exists()) {
            await signOut(auth);
            window.location.href = '/';
            return;
          }
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setIsVerifyingRole(false); 
      }
    }
    verifyAccess();
  }, [user, isUserLoading, mounted, pathname, isUserAdmin, router, role, db, auth]);

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    window.location.href = '/';
  }

  if (!mounted || isUserLoading || isVerifyingRole) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" /></div>
  }

  const adminItems = [
    { title: "Inicio", url: "/dashboard/admin", icon: LayoutDashboard },
    { title: "Academy", url: "/dashboard/admin/academy", icon: GraduationCap },
    { title: "Afiliados", url: "/dashboard/admin/affiliates", icon: Users },
    { title: "Compradores", url: "/dashboard/admin/buyers", icon: UserCheck },
    { title: "Mapa", url: "/dashboard/admin/map", icon: MapPin },
    { title: "Productos", url: "/dashboard/admin/products", icon: Package },
    { title: "Builds", url: "/dashboard/admin/releases", icon: Terminal },
    { title: "Estrategias", url: "/dashboard/admin/sales-lab", icon: Zap },
    { title: "Ventas", url: "/dashboard/admin/sales", icon: ShoppingBag },
    { title: "Config", url: "/dashboard/admin/design", icon: Palette },
  ]

  const affiliateItems = [
    { title: "Panel", url: "/dashboard/affiliate", icon: LayoutDashboard },
    { title: "Academy", url: "/dashboard/affiliate/academy", icon: GraduationCap },
    { title: "Mercado", url: "/dashboard/affiliate/products", icon: ShoppingBag },
    { title: "Estrategias", url: "/dashboard/affiliate/sales-lab", icon: Flame },
    { title: "Clientes", url: "/dashboard/affiliate/buyers", icon: Users2 },
    { title: "Pagos", url: "/dashboard/affiliate/profile", icon: UserCircle },
  ]

  const menuItems = isUserAdmin ? adminItems : affiliateItems;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-[100] w-full bg-slate-950 text-white border-b border-white/5">
        <div className="h-16 md:h-20 flex items-center px-4 md:px-10 justify-between">
          <div className="flex items-center gap-8">
            <Link href={isUserAdmin ? "/dashboard/admin" : "/dashboard/affiliate"} className="shrink-0">
              <div className="relative h-8 w-24 md:h-10 md:w-32">
                {displayLogoUrl ? (
                  <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
                ) : (
                  <span className="text-white font-black text-lg italic uppercase tracking-tighter">Sync<span className="text-primary">Connect</span></span>
                )}
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <Link 
                  key={item.url} 
                  href={item.url} 
                  className={cn(
                    "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                    pathname === item.url ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-all text-left">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-sm">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-white/40">Cuenta {role}</p>
                    <p className="text-xs font-black uppercase truncate max-w-[100px]">{user?.displayName?.split(' ')[0] || 'Socio'}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-40 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 bg-slate-900 border-white/5 text-white rounded-2xl shadow-2xl mt-2">
                <DropdownMenuLabel className="p-4 border-b border-white/5 mb-2">
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Identificado como:</p>
                   <p className="text-sm font-black truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-3 text-red-400 focus:bg-red-400/10 focus:text-red-400 font-black text-[10px] uppercase tracking-widest gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" /> CERRAR SESIÓN
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="relative w-[85%] max-w-xs bg-slate-900 h-full animate-in slide-in-from-right duration-300">
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                 <span className="font-black text-white text-lg uppercase italic tracking-tighter">Sync <span className="text-primary">Menu</span></span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/40 hover:text-white"><X className="h-6 w-6" /></button>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)] p-6">
                 <div className="space-y-2">
                   {menuItems.map((item) => (
                     <Link 
                      key={item.url} 
                      href={item.url} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all",
                        pathname === item.url ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:bg-white/5"
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

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">{children}</main>

      <footer className="py-12 border-t border-slate-200 bg-white text-center">
         <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em]">Sync Connect Proprietary System • El Salvador & Nicaragua</p>
      </footer>
    </div>
  )
}
