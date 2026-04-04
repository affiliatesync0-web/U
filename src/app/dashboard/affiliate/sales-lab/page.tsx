
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
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
  Globe
} from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function SalesLabPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "¡Copiado!", description: "Listo para usar en tus redes sociales." });
  };

  const hooks = [
    { 
      id: 'hook-1',
      title: "El Gancho de la Curiosidad", 
      text: "¿Sabías que el 90% de los emprendedores digitales en Nicaragua están ignorando esta herramienta? Te revelo el secreto en el link de mi bio. 🚀",
      category: "Reels / TikTok"
    },
    { 
      id: 'hook-2',
      title: "Gancho de Urgencia", 
      text: "Solo quedan 5 cupos para nuestra próxima mentoría de marketing. Si no actúas ahora, tu competencia lo hará por ti. ⏰",
      category: "Historias"
    },
    { 
      id: 'hook-3',
      title: "Gancho de Resultados", 
      text: "De $0 a mis primeros $1000 vendiendo productos digitales sin tener experiencia previa. Mira cómo lo logré aquí. 💰",
      category: "Post / Feed"
    }
  ];

  const scripts = [
    {
      id: 'script-1',
      title: "Bienvenida WhatsApp (Primer Contacto)",
      text: "¡Hola! Qué gusto saludarte. 👋 Vi que te interesó el Curso de Marketing Digital Sync. Cuéntame, ¿ya tienes algún emprendimiento o estás empezando desde cero para poder guiarte mejor? 😊",
      type: "Atracción"
    },
    {
      id: 'script-2',
      title: "Manejo de Objeción: 'No tengo dinero'",
      text: "Te entiendo perfectamente, justamente por eso este curso es ideal para ti. Está diseñado para que generes tus primeros ingresos invirtiendo lo mínimo. ¿Te gustaría ver un testimonio de alguien que empezó igual que tú? 🚀",
      type: "Cierre"
    },
    {
      id: 'script-3',
      title: "Cierre Directo (Venta Final)",
      text: "¡Perfecto! Ya solo queda un paso para que accedas a toda la academia. Aquí tienes los datos bancarios para el depósito. En cuanto envíes el voucher, te activo el acceso de inmediato. ¿Te parece bien? ✅",
      type: "Venta"
    }
  ];

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
            <p className="text-lg text-slate-500 font-medium max-w-2xl">Material de alto impacto diseñado para que captes clientes y cierres ventas en tiempo récord.</p>
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

        <Tabs defaultValue="hooks" className="w-full">
          <TabsList className="w-full h-20 bg-white border border-slate-100 rounded-[2.5rem] p-2 shadow-sm flex mb-10 overflow-hidden">
            <TabsTrigger value="hooks" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Flame className="h-4 w-4" /> Ganchos de Venta
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <MessageSquare className="h-4 w-4" /> Scripts de WhatsApp
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Target className="h-4 w-4" /> Estrategias Pro
            </TabsTrigger>
          </TabsList>

          {/* GANCHOS DE VENTA */}
          <TabsContent value="hooks" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                      "{hook.text}"
                    </div>
                    <Button 
                      onClick={() => handleCopy(hook.text, hook.id)}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 gap-2"
                    >
                      {copiedIndex === hook.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      COPIAR GANCHO
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SCRIPTS DE WHATSAPP */}
          <TabsContent value="scripts" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              {scripts.map((script) => (
                <Card key={script.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-64 bg-slate-900 p-8 flex flex-col justify-between text-white border-r border-white/5">
                       <div>
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                           script.type === 'Venta' ? "bg-green-500 border-green-400" : "bg-primary/20 border-primary/40"
                         )}>
                           Fase: {script.type}
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
                         "{script.text}"
                       </div>
                       <div className="mt-6 flex justify-end">
                         <Button 
                          onClick={() => handleCopy(script.text, script.id)}
                          className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105"
                         >
                           {copiedIndex === script.id ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                           Copiar Script de Cierre
                         </Button>
                       </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ESTRATEGIAS PRO */}
          <TabsContent value="strategy" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden">
                <div className="p-12 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                      <Facebook className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-headline font-black tracking-tight">Marketing Orgánico</h3>
                      <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Cero Inversión - Alto Esfuerzo</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-6">
                    {[
                      "Únete a grupos de 'Emprendedores Nicaragua' y aporta valor sin vender.",
                      "Crea un Reel diario mostrando tus resultados o los del equipo Sync.",
                      "Responde comentarios con preguntas para llevarlos al mensaje directo.",
                      "Usa estados de WhatsApp cada 4 horas para mantenerte en el radar."
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-4 group">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-black group-hover:bg-primary transition-colors">{i+1}</div>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
                <div className="p-12 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                      <Globe className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-headline font-black text-slate-900 tracking-tight">Embudos de Venta</h3>
                      <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Sistema Automatizado Sync</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 space-y-3">
                      <h4 className="text-xs font-black text-blue-900 uppercase">Paso Maestro:</h4>
                      <p className="text-sm font-medium text-blue-800 leading-relaxed italic">
                        "Lleva a todo el tráfico a tu link de divulgación. Nuestra página de checkout está optimizada para que el cliente no dude en pagar."
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-2">
                          <Instagram className="h-6 w-6 text-pink-500" />
                          <span className="text-[9px] font-black uppercase text-slate-400">Tráfico Frío</span>
                       </div>
                       <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-2">
                          <Smartphone className="h-6 w-6 text-green-500" />
                          <span className="text-[9px] font-black uppercase text-slate-400">Tráfico Caliente</span>
                       </div>
                    </div>

                    <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest gap-2">
                      VER VIDEO DE ESTRATEGIA COMPLETA <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* FOOTER CTA */}
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
