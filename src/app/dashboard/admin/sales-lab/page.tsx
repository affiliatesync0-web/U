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
  MessageSquare, 
  Target, 
  Loader2, 
  Flame, 
  Save
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
      toast({ variant: "destructive", title: "Campos incompletos" })
      return
    }

    addDocumentNonBlocking(collection(db, 'sales_lab'), {
      ...formData,
      createdAt: new Date().toISOString()
    })

    toast({ title: "Recurso Publicado" })
    setIsAdding(false)
    setFormData({ title: '', content: '', type: 'hook', category: 'Reels / TikTok' })
  }

  const handleDelete = (id: string) => {
    if (!db) return;
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
          
          <Button onClick={() => setIsAdding(!isAdding)} className="h-16 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl">
            {isAdding ? "CANCELAR" : <><Plus className="h-5 w-5" /> NUEVO RECURSO</>}
          </Button>
        </div>

        {isAdding && (
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-4 ring-primary/5">
            <CardHeader className="bg-primary p-10 text-white">
              <CardTitle className="text-2xl font-headline font-black uppercase">Crear Material</CardTitle>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hook">Gancho (Hook)</SelectItem>
                      <SelectItem value="script">Script WhatsApp</SelectItem>
                      <SelectItem value="strategy">Estrategia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Título</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 rounded-xl" />
                </div>
              </div>
              <div className="space-y-6 flex flex-col">
                <div className="space-y-2 flex-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Contenido</Label>
                  <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="h-full min-h-[150px] rounded-2xl bg-slate-50 p-6" />
                </div>
                <Button onClick={handleSave} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-xl">
                  <Save className="h-5 w-5 mr-2" /> PUBLICAR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="hooks" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full h-20 bg-white border rounded-[2.5rem] p-2 mb-10 overflow-hidden">
            <TabsTrigger value="hooks" className="flex-1 rounded-[2rem] font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Flame className="h-4 w-4 mr-2" /> Ganchos
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex-1 rounded-[2rem] font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4 mr-2" /> Scripts
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex-1 rounded-[2rem] font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" /> Estrategias
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-50" /></div>
          ) : (
            <>
              <TabsContent value="hooks" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {resources?.filter(r => r.type === 'hook').map((hook) => (
                  <ResourceAdminCard key={hook.id} resource={hook} onDelete={() => handleDelete(hook.id)} />
                ))}
              </TabsContent>
              <TabsContent value="scripts" className="space-y-6">
                {resources?.filter(r => r.type === 'script').map((script) => (
                  <ResourceAdminCard key={script.id} resource={script} onDelete={() => handleDelete(script.id)} />
                ))}
              </TabsContent>
              <TabsContent value="strategies" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {resources?.filter(r => r.type === 'strategy').map((strategy) => (
                  <ResourceAdminCard key={strategy.id} resource={strategy} onDelete={() => handleDelete(strategy.id)} />
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardShell>
  )
}

function ResourceAdminCard({ resource, onDelete }: any) {
  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100 group">
      <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{resource.category}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <CardContent className="p-8 space-y-4">
        <h3 className="text-lg font-headline font-black text-slate-900 uppercase tracking-tight">{resource.title}</h3>
        <div className="p-5 rounded-2xl bg-slate-900 text-white text-[11px] font-medium leading-relaxed">
          "{resource.content}"
        </div>
      </CardContent>
    </Card>
  )
}
