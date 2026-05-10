
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Trash2, 
  Zap, 
  MessageSquare, 
  Target, 
  Loader2, 
  Flame, 
  Save,
  CheckCircle2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

export default function AdminSalesLabPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState('hooks')

  const labQuery = useMemoFirebase(() => collection(db, 'sales_lab'), [db])
  const { data: resources, isLoading } = useCollection(labQuery)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'hook',
    category: 'Reels / TikTok'
  })

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Por favor llena el título y el contenido." })
      return
    }

    addDocumentNonBlocking(collection(db, 'sales_lab'), {
      ...formData,
      createdAt: new Date().toISOString()
    })

    toast({ title: "Recurso Publicado", description: "Tus afiliados ya pueden ver este nuevo material." })
    setIsAdding(false)
    setFormData({ title: '', content: '', type: activeTab === 'hooks' ? 'hook' : (activeTab === 'scripts' ? 'script' : 'strategy'), category: '' })
  }

  const handleDelete = (id: string) => {
    // CORRECCIÓN: Usar doc() para crear la referencia correcta al documento antes de eliminar
    deleteDocumentNonBlocking(doc(db, 'sales_lab', id))
    toast({ title: "Recurso eliminado" })
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">Editor del <span className="text-primary">Laboratorio de Ventas</span></h1>
            <p className="text-slate-500 font-medium">Redacta los ganchos y scripts que tus afiliados usarán para vender.</p>
          </div>
          
          <Button onClick={() => setIsAdding(!isAdding)} className="h-16 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl hover:scale-105 transition-all">
            {isAdding ? "CANCELAR EDICIÓN" : <><Plus className="h-5 w-5" /> NUEVO RECURSO</>}
          </Button>
        </div>

        {isAdding && (
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden animate-in slide-in-from-top-4 duration-500 ring-4 ring-primary/5">
            <CardHeader className="bg-primary p-10 text-white">
              <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight">Crear Nuevo Material</CardTitle>
              <CardDescription className="text-white/70 font-bold">Define si es un gancho de atención o un script de cierre.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Recurso</Label>
                  <Select value={formData.type} onValueChange={(v: any) => {
                    setFormData({...formData, type: v, category: v === 'hook' ? 'Reels / TikTok' : (v === 'script' ? 'Bienvenida' : 'Marketing Orgánico')})
                  }}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hook">Gancho de Venta (Hook)</SelectItem>
                      <SelectItem value="script">Script de WhatsApp</SelectItem>
                      <SelectItem value="strategy">Estrategia Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Título / Táctica</Label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej: El Gancho de la Curiosidad"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Categoría / Fase</Label>
                  <Input 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Ej: Reels, TikTok, Objeciones..."
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="space-y-2 flex-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Contenido (Lo que el afiliado copiará)</Label>
                  <Textarea 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="Escribe aquí el texto persuasivo..."
                    className="h-full min-h-[150px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-6 font-medium text-sm"
                  />
                </div>
                <Button onClick={handleSave} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-primary/20">
                  <Save className="h-5 w-5" /> PUBLICAR EN EL LABORATORIO
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="hooks" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full h-20 bg-white border border-slate-100 rounded-[2.5rem] p-2 shadow-sm flex mb-10 overflow-hidden">
            <TabsTrigger value="hooks" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Flame className="h-4 w-4" /> Ganchos ({resources?.filter(r => r.type === 'hook').length || 0})
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <MessageSquare className="h-4 w-4" /> Scripts ({resources?.filter(r => r.type === 'script').length || 0})
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex-1 h-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Target className="h-4 w-4" /> Estrategias ({resources?.filter(r => r.type === 'strategy').length || 0})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
          ) : (
            <>
              <TabsContent value="hooks" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {resources?.filter(r => r.type === 'hook').map((hook) => (
                  <ResourceAdminCard key={hook.id} resource={hook} onDelete={() => handleDelete(hook.id)} />
                ))}
              </TabsContent>
              <TabsContent value="scripts" className="space-y-6">
                {resources?.filter(r => r.type === 'script').map((script) => (
                  <ResourceAdminCard key={script.id} resource={script} onDelete={() => handleDelete(script.id)} isFull />
                ))}
              </TabsContent>
              <TabsContent value="strategies" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {resources?.filter(r => r.type === 'strategy').map((strategy) => (
                  <ResourceAdminCard key={strategy.id} resource={strategy} onDelete={() => handleDelete(strategy.id)} isFull />
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardShell>
  )
}

function ResourceAdminCard({ resource, onDelete, isFull }: any) {
  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100 group">
      <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{resource.category}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-8 space-y-4">
        <h3 className="text-lg font-headline font-black text-slate-900 uppercase tracking-tight">{resource.title}</h3>
        <div className="p-5 rounded-2xl bg-slate-900 text-white text-[11px] font-medium leading-relaxed shadow-inner">
          "{resource.content}"
        </div>
      </CardContent>
    </Card>
  )
}
