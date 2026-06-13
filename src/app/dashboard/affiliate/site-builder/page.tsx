"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Globe, ExternalLink, Copy, Check, Trash2, Rocket, Layout, FileText, BrainCircuit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, query, where, doc } from 'firebase/firestore'
import { generateWebsiteContent } from '@/ai/flows/generate-website-flow'
import Link from 'next/link'

export default function AffiliateSiteBuilderPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [generating, setGenerating] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db])
  const { data: products } = useCollection(productsRef)

  const profileRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(profileRef);

  const sitesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'user_sites'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: userSites, isLoading: loadingSites } = useCollection(sitesQuery);

  const handleGenerate = async () => {
    if (!selectedProductId || !user || !profile) {
      toast({ variant: "destructive", title: "Selección requerida", description: "Elige un producto para que la IA trabaje." });
      return;
    }

    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    setGenerating(true);
    try {
      const content = await generateWebsiteContent({
        productName: product.name,
        description: product.description || '',
        affiliateName: profile.firstName?.toUpperCase() || "SOCIO SYNC"
      });

      await addDocumentNonBlocking(collection(db, 'user_sites'), {
        userId: user.uid,
        productId: selectedProductId,
        productName: product.name,
        productImageUrl: product.imageUrl || '',
        content: content,
        createdAt: new Date().toISOString(),
        published: true,
        isAdminSite: false
      });

      toast({ title: "¡Sitio Web Creado!", description: "La IA ha terminado tu página publicitaria." });
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Error en la IA", 
        description: "Hubo un problema al conectar con el cerebro de Sync Lab." 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSite = (id: string) => {
    if (confirm("¿Eliminar esta página permanentemente?")) {
      deleteDocumentNonBlocking(doc(db, 'user_sites', id));
      toast({ title: "Página eliminada" });
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/site/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace Copiado", description: "Tu enlace de venta directa está listo." });
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Sync Lab Technology</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Web <span className="text-primary">Builder AI</span></h1>
            <p className="text-slate-500 font-medium">Crea páginas de publicidad persuasivas para tus productos usando IA.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <Card className="lg:col-span-4 border-none shadow-2xl rounded-[3rem] bg-slate-950 text-white overflow-hidden ring-1 ring-white/5">
            <CardHeader className="p-10 border-b border-white/5">
              <CardTitle className="text-xl font-headline font-black uppercase flex items-center gap-3">
                <Rocket className="h-6 w-6 text-primary" /> Nueva Campaña
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Elegir Producto para Vender</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-6 bg-primary/10 rounded-[2.5rem] border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase">Core Inteligencia Artificial</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                  "Generaré una estructura de venta con gatillos mentales, beneficios y un cierre directo a tu checkout."
                </p>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={generating || !selectedProductId}
                className="w-full h-18 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-2xl shadow-primary/20 transition-all active:scale-95"
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> CREANDO PÁGINA...</>
                ) : (
                  <><Layout className="mr-2 h-5 w-5" /> GENERAR LANDING PAGE</>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-8 space-y-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
              <Globe className="h-4 w-4" /> Mis Sitios Publicitarios
            </h3>

            {loadingSites ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
            ) : !userSites || userSites.length === 0 ? (
              <div className="text-center py-32 bg-white/50 rounded-[4rem] border-2 border-dashed border-slate-200">
                <Globe className="h-16 w-16 mx-auto mb-4 text-slate-100" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin páginas creadas todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userSites.map((site) => (
                  <Card key={site.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all">
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      {site.productImageUrl ? (
                        <img src={site.productImageUrl} alt="preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-200"><FileText className="h-12 w-12" /></div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button asChild variant="outline" className="rounded-full border-white text-white font-black text-[9px] uppercase h-10 hover:bg-white hover:text-slate-900">
                          <Link href={`/site/${site.id}`} target="_blank"><ExternalLink className="mr-2 h-3.5 w-3.5" /> VER PÁGINA</Link>
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-8 space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-sm text-slate-900 uppercase truncate pr-4">{site.productName}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: Publicado</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteSite(site.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => copyToClipboard(site.id)}
                          className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg"
                        >
                          {copiedId === site.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          {copiedId === site.id ? "COPIADO" : "COPIAR LINK PÚBLICO"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
