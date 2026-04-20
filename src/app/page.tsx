"use client"

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
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import placeholderData from '@/app/lib/placeholder-images.json';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();

  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs, isLoading: isConfigLoading } = useCollection(configQuery);

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
            <span className="text-white text-[12px] leading-tight">Hola, identifícate</span>
            <div className="flex items-center">
              <span className="text-white font-black text-[14px] leading-tight">Cuenta y Listas</span>
              <ChevronDown className="h-3 w-3 text-[#CCCCCC] ml-1" />
            </div>
          </Link>

          <Link href="/auth/login" className="hidden md:flex flex-col items-start p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left">
            <span className="text-white text-[12px] leading-tight">Devoluciones</span>
            <span className="text-white font-black text-[14px] leading-tight">y Pedidos</span>
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
        <button className="flex items-center gap-1.5 p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white text-white font-black text-[14px] whitespace-nowrap mr-4">
          <Menu className="h-5 w-5" /> Todo
        </button>
        <div className="flex items-center h-full gap-4 text-white text-[14px] font-medium whitespace-nowrap">
          <Link href="/auth/register" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Vender</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Servicios</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Sync Academy</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Lo más vendido</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Lo nuevo</Link>
          <Link href="#" className="p-2 rounded-sm hover:outline hover:outline-1 hover:outline-white">Promociones</Link>
        </div>
        <div className="ml-auto hidden xl:block">
          <span className="text-white font-black text-[14px] uppercase italic tracking-tighter">
            Venganza <span className="font-normal text-[#CCCCCC]">- Ve ahora</span>
          </span>
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
                <p className="text-xl font-bold text-slate-600 mt-2">Prepara tu negocio para el calor con herramientas digitales.</p>
                <div className="flex gap-10 mt-8">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase">Hasta</p>
                     <p className="text-3xl font-black text-slate-900">20% +</p>
                     <p className="text-[10px] font-bold text-slate-500">en productos de formación</p>
                   </div>
                   <div className="border-l pl-10">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Hasta</p>
                     <p className="text-3xl font-black text-slate-900">$2,000</p>
                     <p className="text-[10px] font-bold text-slate-500">en tu primera compra</p>
                   </div>
                </div>
                <Button asChild className="amazon-btn-primary w-full h-12 mt-10 rounded-md">
                   <Link href="/auth/register">Crea tu cuenta gratis</Link>
                </Button>
             </div>
          </div>
        </section>

        {/* CARDS GRID */}
        <section className="container mx-auto px-4 -mt-20 md:-mt-64 relative z-40 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CARD 1 */}
            <div className="amazon-card">
              <h3 className="text-xl font-black text-slate-900 leading-tight">Ofertas en tendencia</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="aspect-square relative bg-slate-50 p-4">
                     <Image src="https://picsum.photos/seed/p1/200/200" alt="p1" fill className="object-contain p-2" unoptimized />
                     <Badge className="absolute bottom-1 left-1 bg-[#CC0C39] text-white border-none text-[10px] px-1 py-0 rounded-none">-53% Promoción</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="aspect-square relative bg-slate-50 p-4">
                     <Image src="https://picsum.photos/seed/p2/200/200" alt="p2" fill className="object-contain p-2" unoptimized />
                     <Badge className="absolute bottom-1 left-1 bg-[#CC0C39] text-white border-none text-[10px] px-1 py-0 rounded-none">-16% Promoción</Badge>
                  </div>
                </div>
                <div className="aspect-square relative bg-slate-50 p-4">
                   <Image src="https://picsum.photos/seed/p3/200/200" alt="p3" fill className="object-contain p-2" unoptimized />
                </div>
                <div className="aspect-square relative bg-slate-50 p-4">
                   <Image src="https://picsum.photos/seed/p4/200/200" alt="p4" fill className="object-contain p-2" unoptimized />
                </div>
              </div>
              <Link href="/auth/login" className="text-[#007185] hover:text-[#C45500] hover:underline text-[13px] font-medium mt-2">Ver todo en ofertas</Link>
            </div>

            {/* CARD 2 */}
            <div className="amazon-card">
              <h3 className="text-xl font-black text-slate-900 leading-tight">El Lujo de ser Prime</h3>
              <div className="flex-1 relative aspect-square md:aspect-auto md:h-full bg-blue-600 p-8 flex flex-col justify-center text-white text-center gap-6 overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Star className="h-32 w-32" /></div>
                 <h4 className="text-2xl font-black leading-tight">Hasta 15% adicional con bancos participantes</h4>
                 <div className="space-y-2 pt-4 border-t border-white/20">
                    <p className="text-2xl font-black tracking-widest italic">BANPRO</p>
                    <p className="text-2xl font-black tracking-widest italic">LAFISE</p>
                 </div>
              </div>
              <Link href="/auth/register" className="text-[#007185] hover:text-[#C45500] hover:underline text-[13px] font-medium mt-2">Conoce los beneficios</Link>
            </div>

            {/* CARD 3 */}
            <div className="amazon-card">
              <h3 className="text-xl font-black text-slate-900 leading-tight">Todo lo que necesitas en Sync Academy</h3>
              <div className="flex-1 relative aspect-square overflow-hidden bg-slate-50 flex items-center justify-center p-6">
                 <div className="h-48 w-48 rounded-full border-[10px] border-primary flex items-center justify-center p-8 bg-white shadow-xl relative overflow-hidden group">
                    <GraduationCap className="h-20 w-20 text-slate-900 group-hover:rotate-12 transition-transform" />
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                 </div>
              </div>
              <Link href="/auth/login" className="text-[#007185] hover:text-[#C45500] hover:underline text-[13px] font-medium mt-2">Explorar cursos</Link>
            </div>

            {/* CARD 4 */}
            <div className="amazon-card">
              <h3 className="text-xl font-black text-slate-900 leading-tight">Hasta 50% y 12 MSI en herramientas PRO</h3>
              <div className="flex-1 relative aspect-square overflow-hidden bg-[#FCD7E5] group">
                 <Image src="https://picsum.photos/seed/doll/400/400" alt="promo" fill className="object-contain p-8 group-hover:scale-110 transition-transform duration-1000" unoptimized />
              </div>
              <p className="text-[12px] text-slate-500 font-bold uppercase mt-2">Software & Hardware</p>
              <Link href="/auth/login" className="text-[#007185] hover:text-[#C45500] hover:underline text-[13px] font-medium mt-2">Comprar ahora</Link>
            </div>

          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#232F3E] text-white pt-10 pb-10 flex flex-col items-center gap-10">
         <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full h-12 bg-[#37475A] hover:bg-[#485769] text-white text-[13px] font-medium transition-colors">
            Inicio de la página
         </button>

         <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 max-w-5xl py-10">
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Conócenos</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="#" className="hover:underline">Trabajar en Sync</Link></li>
                  <li><Link href="#" className="hover:underline">Acerca de Sync Connect</Link></li>
                  <li><Link href="#" className="hover:underline">Sostenibilidad</Link></li>
               </ul>
            </div>
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Gana dinero</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="/auth/register" className="hover:underline">Vender en Sync</Link></li>
                  <li><Link href="#" className="hover:underline">Programa de Afiliados</Link></li>
                  <li><Link href="#" className="hover:underline">Anuncia tus productos</Link></li>
               </ul>
            </div>
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Métodos de pago</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="#" className="hover:underline">Tarjeta de crédito</Link></li>
                  <li><Link href="#" className="hover:underline">Depósito bancario local</Link></li>
                  <li><Link href="#" className="hover:underline">Pago contra entrega</Link></li>
               </ul>
            </div>
            <div className="space-y-4">
               <h4 className="font-black text-sm uppercase">Podemos ayudarte</h4>
               <ul className="space-y-2 text-[13px] text-[#DDD]">
                  <li><Link href="#" className="hover:underline">Gestionar mi cuenta</Link></li>
                  <li><Link href="#" className="hover:underline">Tus pedidos</Link></li>
                  <li><Link href="#" className="hover:underline">Ayuda</Link></li>
               </ul>
            </div>
         </div>

         <div className="w-full border-t border-white/10 py-10 flex flex-col items-center gap-6">
            <div className="h-10 w-24 relative opacity-80 grayscale brightness-200">
               {displayLogoUrl ? (
                 <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
               ) : (
                 <span className="text-white font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
               )}
            </div>
            <p className="text-[12px] text-[#AAA] text-center max-w-lg px-4">
               © 2024 Sync Connect Nicaragua. Todos los derechos reservados. <br/>
               Inspirado en la excelencia logística y comercial de Amazon.
            </p>
         </div>
      </footer>
    </div>
  );
}

function ChevronDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
}

function GraduationCap(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922 12 4.19 2.58 10.922l8.97 6.444a.8.8 0 0 0 .9 0l8.97-6.444Z"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
  )
}