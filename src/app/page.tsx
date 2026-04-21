"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  MapPin, 
  Menu, 
  ShoppingCart,
  Loader2,
  ChevronDown,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Home() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs } = useCollection(configQuery);

  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const getOverride = (id: string) => configs?.find(c => c.id === id);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(getOverride('site-logo')?.imageUrl || defaultLogo?.imageUrl || "");

  return (
    <div className="flex flex-col min-h-screen bg-[#EAEDED]">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-[#131921] h-[60px] md:h-[72px] flex items-center px-4 gap-4 sticky top-0 z-[100]">
        <Link href="/" className="flex items-center p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white shrink-0">
          <div className="relative h-8 w-24 md:h-10 md:w-32">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain" unoptimized />
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

        <div className="flex-1 flex h-10 md:h-11 items-center group">
          <div className="flex-1 flex h-full bg-white rounded-md overflow-hidden ring-offset-0 focus-within:ring-[3px] focus-within:ring-[#FF9900] transition-shadow">
            <button className="hidden md:flex items-center px-4 bg-[#F3F3F3] text-[#555] text-[12px] border-r border-[#CDCDCD] font-bold uppercase">
              Todos <ChevronDown className="h-3 w-3 ml-2" />
            </button>
            <Input 
              placeholder="Buscar productos oficiales..." 
              className="flex-1 border-none focus-visible:ring-0 text-[15px] h-full rounded-none bg-transparent px-4 font-medium text-slate-800" 
            />
            <button className="bg-[#FEBD69] hover:bg-[#F3A847] w-12 md:w-14 h-full flex items-center justify-center">
              <Search className="h-6 w-6 text-[#333]" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link href="/auth/login" className="flex flex-col items-start p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left">
            <span className="text-white text-[12px] leading-tight">Hola, {user ? user.displayName?.split(' ')[0] : 'identifícate'}</span>
            <div className="flex items-center">
              <span className="text-white font-black text-[14px] leading-tight">Cuenta</span>
              <ChevronDown className="h-3 w-3 text-[#CCCCCC] ml-1" />
            </div>
          </Link>

          <Link href="/auth/register" className="flex items-end p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white relative">
            <div className="relative">
              <ShoppingCart className="h-9 w-9 text-white" />
              <span className="absolute top-[-2px] left-[55%] -translate-x-1/2 text-[#FF9900] font-black text-[16px] leading-none">0</span>
            </div>
            <span className="text-white font-black text-[14px] mb-1.5 hidden lg:inline ml-1">Market</span>
          </Link>
        </div>
      </header>

      {/* SUB NAV */}
      <nav className="bg-[#232F3E] h-[39px] flex items-center px-4 overflow-x-auto no-scrollbar border-b border-black/10">
        <button className="flex items-center gap-1.5 p-2 text-white font-black text-[14px] whitespace-nowrap mr-4">
          <Menu className="h-5 w-5" /> Todo
        </button>
        <div className="flex items-center h-full gap-4 text-white text-[14px] font-medium whitespace-nowrap">
          <Link href="/auth/register" className="p-2 hover:underline">Vender en Sync</Link>
          <Link href="#" className="p-2 hover:underline">Lo más vendido</Link>
        </div>
      </nav>

      {/* CONTENIDO DINÁMICO (SÓLO PRODUCTOS REALES) */}
      <main className="flex-1 pb-20">
        <div className="relative h-[250px] md:h-[450px] w-full bg-slate-900 overflow-hidden">
           <Image src="https://picsum.photos/seed/sync_main/1500/600" alt="Banner" fill className="object-cover opacity-40" priority unoptimized />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#EAEDED]" />
           <div className="absolute inset-0 flex items-center px-10 md:px-20">
              <div className="max-w-xl space-y-4">
                 <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase italic tracking-tighter">
                   Elite <span className="text-primary">Marketplace</span>
                 </h1>
                 <p className="text-lg text-slate-200 font-bold uppercase tracking-widest">Productos verificados con logística en Nicaragua.</p>
              </div>
           </div>
        </div>

        <section className="container mx-auto px-4 -mt-16 md:-mt-32 relative z-40">
          {productsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
          ) : !products || products.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-sm border shadow-sm">
               <Package className="h-16 w-16 mx-auto text-slate-200 mb-4" />
               <h3 className="text-xl font-black text-slate-900 uppercase italic">Esperando lanzamiento de catálogo</h3>
               <p className="text-slate-500 mt-2">Próximamente aparecerán aquí los productos oficiales del administrador.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white border p-5 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 min-h-[3rem] uppercase mb-4">{product.name}</h3>
                  <div className="aspect-square relative bg-slate-50 p-4 mb-4 rounded-sm overflow-hidden">
                     <Image 
                       src={product.imageUrl || "https://picsum.photos/seed/prod/300/300"} 
                       alt={product.name} 
                       fill 
                       className="object-contain p-2 hover:scale-105 transition-transform" 
                       unoptimized={product.imageUrl?.startsWith('data:')}
                     />
                  </div>
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                       <p className="text-2xl font-black text-[#B12704]">${product.price?.toFixed(2)}</p>
                       {product.type === 'Físico' && (
                         <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded">CONTRA ENTREGA</span>
                       )}
                    </div>
                    <Link href={`/checkout/${product.id}`} className="block w-full text-center amazon-btn-primary py-2 text-[13px] font-bold">Comprar ahora</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-[#131A22] text-white py-20 border-t-8 border-[#232F3E] text-center">
         <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
         <p className="text-[11px] text-[#AAA] mt-4 uppercase tracking-widest">© 2024 Sync Connect Nicaragua. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
