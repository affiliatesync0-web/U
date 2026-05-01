"use client"

import { useState, useEffect } from "react"
import { MessageCircle, ShieldCheck } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { cn } from "@/lib/utils"

/**
 * Componente de Soporte Oficial de WhatsApp con diseño Premium.
 * Se oculta si el usuario está logueado para no estorbar en el dashboard.
 */
export function FloatingContact() {
  const db = useFirestore();
  const { user } = useUser();
  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs } = useCollection(configQuery);

  const whatsappConfig = configs?.find(c => c.id === 'site-whatsapp');
  const phoneNumber = whatsappConfig?.value || "";

  if (user || !phoneNumber) return null;

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  return (
    <div className="fixed bottom-8 right-8 z-[9999] animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pl-4 pr-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_rgba(37,211,102,0.2)] transition-all hover:scale-105 active:scale-95 ring-1 ring-slate-100 dark:ring-slate-800"
      >
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-0.5">Soporte</span>
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">Sync Connect</span>
        </div>
        
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
            <MessageCircle className="h-6 w-6 fill-current" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
          </span>
        </div>
      </a>
    </div>
  );
}
