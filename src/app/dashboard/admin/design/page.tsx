"use client"

import { useState, useRef, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Mail, 
  ShieldCheck, 
  Send, 
  RefreshCw, 
  Loader2, 
  Smartphone, 
  ImageIcon,
  KeyRound,
  ShieldAlert,
  Server,
  Upload,
  CreditCard,
  MessageSquare,
  Zap,
  Box
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser, initializeFirebase } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { testEmailConfig } from '@/lib/email'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminDesignPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user, isUserLoading } = useUser();
  const [savingId, setSavingId] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  const configQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'site_config');
  }, [db, user, isUserLoading]);
  const { data: overrides, isLoading } = useCollection(configQuery);

  const images = placeholderData.placeholderImages || [];

  const handleSave = (imgId: string, url: string, hint: string) => {
    const configRef = doc(db, 'site_config', imgId);
    setSavingId(imgId);
    
    setDocumentNonBlocking(configRef, {
      id: imgId,
      imageUrl: (url || "").trim(),
      imageHint: (hint || "").trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setSavingId(null);
      toast({ title: "Imagen Actualizada", description: "Cambios aplicados." });
    }, 1000);
  };

  const handleSaveValue = (id: string, data: any) => {
    const configRef = doc(db, 'site_config', id);
    setSavingId(id);
    setDocumentNonBlocking(configRef, { id, ...data, updatedAt: new Date().toISOString() }, { merge: true });
    setTimeout(() => {
      setSavingId(null);
      toast({ title: "Ajuste Guardado", description: "Configuración actualizada." });
    }, 1000);
  };

  const handleSaveSmtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      smtp_host: formData.get('smtp_host'),
      smtp_port: formData.get('smtp_port'),
      smtp_user: formData.get('smtp_user')?.toString().trim(),
      smtp_password: formData.get('smtp_password')?.toString().trim(),
      smtp_from_name: formData.get('smtp_from_name'),
    };
    handleSaveValue('settings', data);
  };

  const handleSaveOpenWa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      baseUrl: formData.get('baseUrl'),
      apiKey: formData.get('apiKey'),
      sessionName: formData.get('sessionName'),
    };
    handleSaveValue('whatsapp-api', data);
  };

  if (isUserLoading || isLoading) {
    return <DashboardShell role="admin"><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardShell>
  }

  const settings = overrides?.find(o => o.id === 'settings') || {};
  const waSettings = overrides?.find(o => o.id === 'whatsapp-api') || {};

  return (
    <DashboardShell role="admin">
      <div className="space-y-12 pb-20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Infraestructura Sync</span>
          </div>
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">Identidad & <span className="text-primary">Conectividad</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* SMTP CONFIG */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl"><Mail className="h-6 w-6" /></div>
                <CardTitle className="text-2xl font-headline font-black uppercase">Gmail SMTP</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSaveSmtp} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Host</Label>
                    <Input name="smtp_host" defaultValue={settings.smtp_host || 'smtp.gmail.com'} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Puerto</Label>
                    <Input name="smtp_port" defaultValue={settings.smtp_port || '465'} className="h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Usuario Gmail</Label>
                  <Input name="smtp_user" defaultValue={settings.smtp_user || ''} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Pass Aplicación (16 dígitos)</Label>
                  <Input name="smtp_password" type="password" defaultValue={settings.smtp_password || ''} className="h-12 rounded-xl font-mono" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px]" disabled={savingId === 'settings'}>
                  {savingId === 'settings' ? <Loader2 className="animate-spin h-4 w-4" /> : "GUARDAR SMTP"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* OPENWA CONFIG */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-[#25D366] text-white p-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-xl"><MessageSquare className="h-6 w-6" /></div>
                <CardTitle className="text-2xl font-headline font-black uppercase">WhatsApp OpenWA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSaveOpenWa} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Base URL (LocalWA Server)</Label>
                  <Input name="baseUrl" defaultValue={waSettings.baseUrl || 'http://localhost:2785'} className="h-12 rounded-xl" placeholder="http://ip-del-servidor:2785" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">X-API-Key</Label>
                  <Input name="apiKey" defaultValue={waSettings.apiKey || ''} className="h-12 rounded-xl font-mono" placeholder="Tu API Key de OpenWA" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nombre de Sesión</Label>
                  <Input name="sessionName" defaultValue={waSettings.sessionName || 'my-bot'} className="h-12 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-[#075E54] text-white font-black uppercase text-[10px]" disabled={savingId === 'whatsapp-api'}>
                  {savingId === 'whatsapp-api' ? <Loader2 className="animate-spin h-4 w-4" /> : "CONECTAR WHATSAPP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* OTROS AJUSTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Card className="premium-card p-10 space-y-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-black uppercase tracking-tight italic">Link de Activación</h3>
            </div>
            <Input 
              placeholder="URL de pago membresía..." 
              defaultValue={overrides?.find(o => o.id === 'affiliate-payment-link')?.value}
              onBlur={(e) => handleSaveValue('affiliate-payment-link', { value: e.target.value })}
              className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-6 font-bold"
            />
          </Card>

          <Card className="premium-card p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-black uppercase tracking-tight italic">Soporte Central</h3>
            </div>
            <Input 
              placeholder="50588888888" 
              defaultValue={overrides?.find(o => o.id === 'site-whatsapp')?.value}
              onBlur={(e) => handleSaveValue('site-whatsapp', { value: e.target.value })}
              className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-6 font-mono font-bold"
            />
          </Card>
        </div>

        {/* ASSETS VISUALES */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-primary rounded-full" />
            <h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight">Activos Visuales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {images.map((img) => (
              <ImageEditorCard 
                key={img.id}
                id={img.id}
                description={img.description}
                defaultUrl={overrides?.find(o => o.id === img.id)?.imageUrl || img.imageUrl}
                defaultHint={overrides?.find(o => o.id === img.id)?.imageHint || img.imageHint}
                onSave={handleSave}
                isSaving={savingId === img.id}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function ImageEditorCard({ id, description, defaultUrl, defaultHint, onSave, isSaving }: any) {
  const [url, setUrl] = useState(defaultUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setUrl(defaultUrl); }, [defaultUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { storage } = initializeFirebase();
      const storageRef = ref(storage, `site_assets/${id}_${Date.now()}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', null, 
        (err) => { 
          console.error("Upload error:", err);
          setUploading(false); 
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUrl(downloadURL);
            onSave(id, downloadURL, defaultHint);
          } catch (e) {
            console.error("Error finalizing design asset upload:", e);
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) { 
      console.error("Storage initialization failed:", error);
      setUploading(false); 
    }
  };

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:scale-[1.02] transition-all ring-1 ring-slate-100">
      <div className="relative h-48 w-full bg-slate-100 flex items-center justify-center">
        {url ? <img src={getGoogleDriveDirectLink(url)} className="h-full w-full object-cover" alt="" /> : <ImageIcon className="h-10 w-10 text-slate-200" />}
        {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[8px] font-black uppercase text-primary shadow-xl">{id}</div>
      </div>
      <CardContent className="p-8 space-y-4">
        <p className="text-[10px] font-bold text-slate-400 min-h-[2rem]">{description}</p>
        <Button variant="outline" className="w-full h-11 rounded-xl border-dashed border-2 text-[9px] font-black uppercase" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="h-3 w-3 mr-2" /> SUBIR ARCHIVO
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        <Button onClick={() => onSave(id, url, defaultHint)} className="w-full h-11 rounded-xl bg-primary text-white font-black text-[9px] uppercase shadow-lg shadow-primary/20" disabled={isSaving || uploading}>
          {isSaving ? <Loader2 className="animate-spin h-3 w-3" /> : "GUARDAR CAMBIOS"}
        </Button>
      </CardContent>
    </Card>
  );
}
