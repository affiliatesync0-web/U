"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MapPin, 
  Menu, 
  ShoppingCart,
  Star,
  Zap,
  TrendingUp,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  UserCircle,
  X,
  GraduationCap as GradIcon,
  Package
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import placeholderData from '@/app/lib/placeholder-images.json';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Home() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs, isLoading: isConfigLoading } = useCollection(configQuery);

  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const getOverride = (id: string) => configs?.find(c => c.id === id);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(getOverride('site-logo')?.imageUrl || defaultLogo?.imageUrl || "");

  const carouselImages = [
    "https://picsum.photos/seed/amazon1/1500/600",
    "https://picsum.photos/seed/amazon2/1500/600",
    "https://picsum.photos/seed/amazon3/1500/600"
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#EAEDED]">
      
      {/* HEADER ROW 1: MASTER BAR */}
      <header className="bg-[#131921] h-[60px] md:h-[72px] flex items-center px-4 gap-4 sticky top-0 z-[100]">
        {/* LOGO */}
        <Link href="/" className="flex items-center p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white shrink-0">
          <div className="relative h-8 w-24 md:h-10 md:w-32">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            )}
          </div>
        </Link>

        {/* LOCATION */}
        <div className="hidden xl:flex items-center p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white cursor-pointer shrink-0">
          <MapPin className="h-5 w-5 text-white mt-1" />
          <div className="flex flex-col ml-1">
            <span className="text-[#CCCCCC] text-[12px] leading-tight">Enviar a</span>
            <span className="text-white text-[14px] font-black leading-tight">Nicaragua</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex-1 flex h-10 md:h-11 items-center group">
          <div className="flex-1 flex h-full bg-white rounded-md overflow-hidden ring-offset-0 focus-within:ring-[3px] focus-within:ring-[#FF9900] transition-shadow">
            <button className="hidden md:flex items-center px-4 bg-[#F3F3F3] text-[#555] text-[12px] border-r border-[#CDCDCD] hover:bg-[#DADADA] font-bold uppercase">
              Todas las categorías <ChevronDown className="h-3 w-3 ml-2" />
            </button>
            <Input 
              placeholder="Buscar en Sync Connect..." 
              className="flex-1 border-none focus-visible:ring-0 text-[15px] h-full rounded-none bg-transparent px-4 font-medium text-slate-800 placeholder:text-slate-500" 
            />
            <button className="bg-[#FEBD69] hover:bg-[#F3A847] w-12 md:w-14 h-full flex items-center justify-center transition-colors">
              <Search className="h-6 w-6 text-[#333]" />
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/auth/login" className="flex flex-col items-start p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left">
            <span className="text-white text-[12px] leading-tight">Hola, {user ? user.displayName?.split(' ')[0] : 'identifícate'}</span>
            <div className="flex items-center">
              <span className="text-white font-black text-[14px] leading-tight">Cuenta y Listas</span>
              <ChevronDown className="h-3 w-3 text-[#CCCCCC] ml-1" />
            </div>
          </Link>

          <Link href="/auth/register" className="flex items-end p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white relative">
            <div className="relative">
              <ShoppingCart className="h-9 w-9 text-white" />
              <span className="absolute top-[-2px] left-[55%] -translate-x-1/2 text-[#FF9900] font-black text-[16px] leading-none">0</span>
            </div>
            <span className="text-white font-black text-[14px] mb-1.5 hidden lg:inline ml-1">Carrito</span>
          </Link>
        </div>
      </header>

      {/* HEADER ROW 2: SUB NAV */}
      <nav className="bg-[#232F3E] h-[39px] flex items-center px-4 overflow-x-auto no-scrollbar border-b border-black/10">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-1.5 p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-white font-black text-[14px] whitespace-nowrap mr-4"
        >
          <Menu className="h-5 w-5" /> Todo
        </button>
        <div className="flex items-center h-full gap-4 text-white text-[14px] font-medium whitespace-nowrap">
          <Link href="/auth/register" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Vender</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Sync Academy</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Lo más vendido</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Promociones</Link>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative h-[300px] md:h-[600px] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#EAEDED] z-10" />
          <Image src={carouselImages[0]} alt="Hero" fill className="object-cover" priority unoptimized />
          
          <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8 z-20 pointer-events-none">
            <button className="h-20 w-12 flex items-center justify-center text-white pointer-events-auto hover:bg-black/10 transition-colors">
              <ChevronLeft className="h-12 w-12" />
            </button>
            <button className="h-20 w-12 flex items-center justify-center text-white pointer-events-auto hover:bg-black/10 transition-colors">
              <ChevronRight className="h-12 w-12" />
            </button>
          </div>

          <div className="absolute top-10 md:top-20 left-10 md:left-20 z-30 max-w-xl space-y-4 hidden md:block">
             <div className="bg-white/90 backdrop-blur p-10 rounded-none shadow-2xl border-t-8 border-orange-500">
                <h1 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Lunes de <span className="text-primary">negocios</span></h1>
                <p className="text-xl font-bold text-slate-600 mt-2">Prepara tu negocio con las mejores herramientas digitales reales.</p>
                <Button asChild className="amazon-btn-primary w-full h-12 mt-10 rounded-md">
                   <Link href="/auth/register">Crea tu cuenta gratis</Link>
                </Button>
             </div>
          </div>
        </section>

        {/* CARDS GRID (SOLO PRODUCTOS REALES) */}
        <section className="container mx-auto px-4 -mt-20 md:-mt-64 relative z-40 pb-20">
          {productsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
          ) : !products || products.length === 0 ? (
            <div className="amazon-card p-20 text-center bg-white/80 backdrop-blur rounded-md">
               <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
               <h3 className="text-xl font-black text-slate-900 uppercase">Sin productos destacados</h3>
               <p className="text-slate-500 mt-2">Próximamente verás aquí las mejores ofertas cargadas por administración.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <div key={product.id} className="amazon-card group">
                  <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 min-h-[3rem] uppercase">{product.name}</h3>
                  <div className="aspect-square relative bg-slate-50 p-4 overflow-hidden mb-4">
                     <Image src={product.imageUrl || "https://picsum.photos/seed/p/300/300"} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" unoptimized />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] text-slate-500 font-bold uppercase">{product.category}</p>
                    <p className="text-xl font-black text-[#B12704]">${product.price?.toFixed(2)}</p>
                  </div>
                  <Link href={`/checkout/${product.id}`} className="text-[#007185] hover:text-[#C45500] hover:underline text-[13px] font-medium mt-2">Comprar ahora</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#232F3E] text-white pt-10 pb-10 flex flex-col items-center gap-10">
         <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full h-12 bg-[#37475A] hover:bg-[#485769] text-white text-[13px] font-medium transition-colors">
            Inicio de la página
         </button>

         <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl py-10">
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Conócenos</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="#" className="hover:underline">Acerca de Sync Connect</Link></li>
                  <li><Link href="#" className="hover:underline">Sostenibilidad</Link></li>
               </ul>
            </div>
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Gana dinero</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="/auth/register" className="hover:underline">Vender en Sync</Link></li>
                  <li><Link href="#" className="hover:underline">Programa de Afiliados</Link></li>
               </ul>
            </div>
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Ayuda</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="/auth/login" className="hover:underline">Gestionar mi cuenta</Link></li>
                  <li><Link href="#" className="hover:underline">Tus pedidos</Link></li>
               </ul>
            </div>
         </div>

         <div className="w-full border-t border-white/10 py-10 flex flex-col items-center gap-6">
            <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            <p className="text-[12px] text-[#AAA] text-center max-w-lg px-4">
               © 2024 Sync Connect Nicaragua. Todos los derechos reservados. <br/>
               Solo productos 100% verificados por administración.
            </p>
         </div>
      </footer>
    </div>
  );
}
