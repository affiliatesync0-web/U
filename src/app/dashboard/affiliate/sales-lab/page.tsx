
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Zap, 
  Target, 
  MessageSquare, 
  Copy, 
  Check, 
  Flame, 
  Smartphone, 
  Facebook, 
  Instagram, 
  Sparkles,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Globe,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export default function SalesLabPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const labQuery = useMemoFirebase(() => collection(db, 'sales_lab'), [db])
  const { data: resources, isLoading } = useCollection(labQuery)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "¡Copiado!", description: "Listo para usar en tus redes sociales." });
  };

  const hooks = resources?.filter(r => r.type === 'hook') || [];
  const scripts = resources?.filter(r => r.type === 'script') || [];
  const strategies = resources?.filter(r => r.type === 'strategy') || [];

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Zap className="h-6 w-6 fill-primary" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Sync Sales Lab</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Laboratorio <span className="text-primary">Elite</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl">Material de alto impacto redactado por la administración para que cierres ventas en tiempo récord.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-[2rem] shadow-2xl">
             <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white">
               <TrendingUp className="h-6 w-6" />
             </div>
             <div className="pr-4">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tu Potencial</p>
               <p className="text-sm font-black text-white uppercase tracking-tight">Vendedor Platinum</p>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
        ) : (
          <Tabs defaultValue="hooks" className="w-full">
            <TabsList className="w-full h-20 bg-white border border-slate-100 rounded-[2.5rem] p-2 shadow-sm flex mb-10 overflow-hidden">
              <TabsTrigger value="hooks" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                <Flame className="h-4 w-4" /> Ganchos de Venta ({hooks.length})
              </TabsTrigger>
              <TabsTrigger value="scripts" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                <MessageSquare className="h-4 w-4" /> Scripts de WhatsApp ({scripts.length})
              </TabsTrigger>
              <TabsTrigger value="strategy" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                <Target className="h-4 w-4" /> Estrategias Pro ({strategies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hooks" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {hooks.length === 0 ? (
                <EmptyState icon={Flame} message="Ganchos próximamente disponibles" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {hooks.map((hook) => (
                    <Card key={hook.id} className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden group hover:-translate-y-2 transition-all duration-500 ring-1 ring-slate-100">
                      <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{hook.category}</span>
                        <Sparkles className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <h3 className="text-xl font-headline font-black text-slate-900 leading-tight">{hook.title}</h3>
                        <div className="p-6 rounded-2xl bg-slate-900 text-white text-xs font-medium leading-relaxed relative shadow-inner">
                          "{hook.content}"
                        </div>
                        <Button 
                          onClick={() => handleCopy(hook.content, hook.id)}
                          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 gap-2"
                        >
                          {copiedId === hook.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          COPIAR GANCHO
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scripts" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {scripts.length === 0 ? (
                <EmptyState icon={MessageSquare} message="Scripts de cierre próximamente" />
              ) : (
                <div className="space-y-6">
                  {scripts.map((script) => (
                    <Card key={script.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-64 bg-slate-900 p-8 flex flex-col justify-between text-white border-r border-white/5">
                           <div>
                             <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-primary/20 border-primary/40">
                               Fase: {script.category}
                             </span>
                             <h4 className="text-sm font-black mt-4 leading-tight uppercase">{script.title}</h4>
                           </div>
                           <div className="mt-8 flex items-center gap-2 opacity-40">
                             <Smartphone className="h-4 w-4" />
                             <span className="text-[8px] font-black uppercase">Optimizado para Móvil</span>
                           </div>
                        </div>
                        <div className="flex-1 p-8 bg-slate-50/50">
                           <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-inner text-sm font-bold text-slate-700 leading-relaxed italic">
                             "{script.content}"
                           </div>
                           <div className="mt-6 flex justify-end">
                             <Button 
                              onClick={() => handleCopy(script.content, script.id)}
                              className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105"
                             >
                               {copiedId === script.id ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                               Copiar Script de Cierre
                             </Button>
                           </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="strategy" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {strategies.length === 0 ? (
                <EmptyState icon={Target} message="Guías de estrategia próximamente" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {strategies.map((strategy) => (
                    <Card key={strategy.id} className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden">
                      <div className="p-12 space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                            <Target className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-headline font-black tracking-tight">{strategy.title}</h3>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{strategy.category}</p>
                          </div>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-4">
                          <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {strategy.content}
                          </p>
                        </div>
                        <Button onClick={() => handleCopy(strategy.content, strategy.id)} variant="outline" className="w-full h-16 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest gap-2">
                          {copiedId === strategy.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          COPIAR ESTRATEGIA
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="p-10 bg-primary/5 rounded-[3.5rem] border-2 border-dashed border-primary/20 text-center space-y-6">
           <div className="h-16 w-16 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl -rotate-3">
             <Lightbulb className="h-8 w-8" />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-headline font-black text-slate-900">¿Tienes un gancho que te funciona?</h3>
             <p className="text-slate-500 font-medium">Compártelo con la administración y ayúdanos a mejorar el laboratorio para todos.</p>
           </div>
           <Button variant="outline" className="h-14 px-10 rounded-2xl border-primary text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
             ENVIAR MI ESTRATEGIA
           </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function EmptyState({ icon: Icon, message }: any) {
  return (
    <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
      <Icon className="h-16 w-16 text-slate-100 mx-auto mb-6" />
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{message}</p>
    </div>
  )
}
