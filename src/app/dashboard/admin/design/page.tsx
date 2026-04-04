"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Mail, 
  ShieldCheck, 
  Send, 
  ExternalLink, 
  Check, 
  Copy, 
  RefreshCw, 
  Loader2, 
  Zap, 
  Smartphone, 
  Facebook, 
  Instagram, 
  Star,
  Image as ImageIcon,
  KeyRound,
  ShieldAlert,
  Server
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
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
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
      toast({
        title: "Imagen Actualizada",
        description: "Los cambios visuales se aplicarán en todo el sitio.",
      });
    }, 1000);
  };

  const handleSaveValue = (id: string, value: string) => {
    const configRef = doc(db, 'site_config', id);
    setSavingId(id);
    
    setDocumentNonBlocking(configRef, {
      id: id,
      value: (value || "").trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setSavingId(null);
      toast({
        title: "Ajuste Guardado",
        description: "La configuración ha sido actualizada.",
      });
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
      updatedAt: new Date().toISOString()
    };

    const configRef = doc(db, 'site_config', 'settings');
    setSavingId('smtp');
    setDocumentNonBlocking(configRef, data, { merge: true });

    setTimeout(() => {
      setSavingId(null);
      toast({
        title: "Configuración Guardada",
        description: "Los ajustes de Gmail se han actualizado correctamente.",
      });
    }, 1000);
  };

  const handleTestEmail = async () => {
    const settings = overrides?.find(o => o.id === 'settings');
    const emailToTest = settings?.smtp_user || 'affiliatesync0@gmail.com';
    
    setTestLoading(true);
    try {
      const result = await testEmailConfig(emailToTest);
      if (result.success) {
        toast({ title: "Prueba Exitosa", description: `Revisa la bandeja de entrada de ${emailToTest}.` });
      } else {
        toast({ variant: "destructive", title: "Fallo en Correo", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error Crítico", description: "No se pudo contactar con el servidor de correo." });
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado", description: `${field} listo para pegar.` });
  };

  if (isUserLoading || isLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  const settings = overrides?.find(o => o.id === 'settings') || {};
  const firebaseConsoleLink = "https://console.firebase.google.com/project/studio-9886993662-50a10/authentication/emails";

  return (
    <DashboardShell role="admin">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Infraestructura Sync</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none">Identidad & <span className="text-primary">Conectividad</span></h1>
            <p className="text-slate-500 font-medium">Controla la marca y asegura las comunicaciones automáticas de tu red.</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-green-50 rounded-2xl border border-green-100">
             <ShieldCheck className="h-5 w-5 text-green-600" />
             <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Servidores Operativos</span>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-slate-900 text-white p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary shadow-2xl rotate-3">
                  <Mail className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-headline font-black text-white">Configuración de Gmail (SMTP)</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                    Habilita el envío de códigos de seguridad y notificaciones de venta
                  </CardDescription>
                </div>
              </div>
              <Button 
                onClick={handleTestEmail} 
                variant="outline" 
                disabled={testLoading}
                className="bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl transition-all"
              >
                {testLoading ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                PROBAR CONEXIÓN
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            
            <Alert className="bg-amber-50 border-amber-200 rounded-[2rem] p-8">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
              <AlertTitle className="text-amber-800 font-black text-xs uppercase tracking-widest ml-2">¿Cómo evitar el error de conexión?</AlertTitle>
              <AlertDescription className="text-amber-700 text-sm font-medium leading-relaxed mt-2 ml-2">
                Gmail no acepta tu clave normal por seguridad. Debes usar una <strong>"Contraseña de Aplicación"</strong> de 16 dígitos.<br/>
                <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-amber-900 font-black underline flex items-center gap-1 mt-3 bg-amber-100/50 w-fit px-4 py-2 rounded-xl">
                  <KeyRound className="h-4 w-4" /> CREAR MI CONTRASEÑA DE APLICACIÓN AQUÍ
                </a>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSaveSmtp} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Servidor SMTP (Host)</Label>
                  <Input name="smtp_host" defaultValue={settings.smtp_host || 'smtp.gmail.com'} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Puerto / SSL</Label>
                  <Input name="smtp_port" defaultValue={settings.smtp_port || '465'} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Tu Gmail Principal</Label>
                  <Input name="smtp_user" defaultValue={settings.smtp_user || 'affiliatesync0@gmail.com'} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Contraseña de Aplicación (16 dígitos)</Label>
                  <Input name="smtp_password" type="password" defaultValue={settings.smtp_password || ''} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 font-black tracking-widest" required placeholder="••••••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nombre Remitente</Label>
                  <Input name="smtp_from_name" defaultValue={settings.smtp_from_name || 'Sync Connect'} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 font-bold" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl bg-primary text-white" disabled={savingId === 'smtp'}>
                {savingId === 'smtp' ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "GUARDAR CONFIGURACIÓN MAESTRA"}
              </Button>
            </form>

            <div className="mt-12 p-10 rounded-[3rem] bg-blue-50/50 border border-blue-100 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Zap className="h-48 w-48 text-blue-500" />
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                 <div className="flex items-center gap-5">
                   <div className="h-14 w-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 -rotate-3">
                     <RefreshCw className="h-8 w-8" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-blue-900 tracking-tight">Vincular con Firebase</h3>
                     <p className="text-xs text-blue-700 font-bold uppercase tracking-widest">Para enviar correos del sistema desde la nube</p>
                   </div>
                 </div>
                 <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-blue-200">
                   <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer">
                     <ExternalLink className="h-4 w-4 mr-2" /> ABRIR CONSOLA FIREBASE
                   </a>
                 </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                 {[
                   { label: "Servidor", value: "smtp.gmail.com" },
                   { label: "Puerto", value: "465" },
                   { label: "Usuario", value: settings.smtp_user || 'affiliatesync0@gmail.com' },
                   { label: "Contraseña", value: settings.smtp_password || 'Ver arriba' },
                 ].map((field) => (
                   <div key={field.label} className="p-6 bg-white rounded-[1.5rem] border border-blue-100 shadow-sm flex flex-col justify-between group hover:scale-[1.02] transition-all">
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">{field.label}</p>
                     <div className="flex items-center justify-between gap-2">
                       <code className="text-[10px] font-black text-blue-900 truncate">{field.value}</code>
                       <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 shrink-0 hover:bg-blue-50 text-blue-500"
                        onClick={() => copyToClipboard(field.value, field.label)}
                       >
                         {copiedField === field.label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 p-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                  <Smartphone className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-headline font-black text-slate-900">Soporte Central</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">WhatsApp de Soporte (Internacional)</Label>
                <Input 
                  placeholder="50588888888" 
                  defaultValue={overrides?.find(o => o.id === 'site-whatsapp')?.value}
                  onBlur={(e) => handleSaveValue('site-whatsapp', e.target.value)}
                  className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-lg font-mono font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-headline font-black text-white">Presencia Digital</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook URL</Label>
                  <Input 
                    placeholder="https://facebook.com/sync" 
                    defaultValue={overrides?.find(o => o.id === 'social-facebook')?.value}
                    onBlur={(e) => handleSaveValue('social-facebook', e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary transition-all px-4 text-xs font-medium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram URL</Label>
                  <Input 
                    placeholder="https://instagram.com/sync" 
                    defaultValue={overrides?.find(o => o.id === 'social-instagram')?.value}
                    onBlur={(e) => handleSaveValue('social-instagram', e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary transition-all px-4 text-xs font-medium text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-primary rounded-full" />
            <h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight">Activos Visuales de Marca</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {images.map((img) => {
              const override = overrides?.find(o => o.id === img.id);
              const currentUrl = (override?.imageUrl || img.imageUrl || "").trim();
              const currentHint = (override?.imageHint || img.imageHint || "").trim();

              return (
                <ImageEditorCard 
                  key={img.id}
                  id={img.id}
                  description={img.description}
                  defaultUrl={currentUrl}
                  defaultHint={currentHint}
                  onSave={handleSave}
                  isSaving={savingId === img.id}
                  t={t}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function ImageEditorCard({ id, description, defaultUrl, defaultHint, onSave, isSaving, t }: any) {
  const [url, setUrl] = useState(defaultUrl);
  const [hint, setHint] = useState(defaultHint);

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-500 ring-1 ring-slate-100">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {url ? (
          <img src={getGoogleDriveDirectLink(url)} alt={description} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        ) : (
          <ImageIcon className="h-12 w-12 text-slate-300 opacity-50" />
        )}
        <div className="absolute top-4 left-4">
          <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-xl">
            {id}
          </div>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        <p className="text-[11px] font-bold text-slate-400 leading-relaxed min-h-[3rem]">{description}</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">URL de la Imagen</Label>
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://drive.google.com/..." 
              className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Concepto IA</Label>
            <Input 
              value={hint} 
              onChange={(e) => setHint(e.target.value)} 
              placeholder="Ej: tech network" 
              className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-medium"
            />
          </div>
        </div>
        <Button 
          onClick={() => onSave(id, url, hint)} 
          className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "GUARDAR CAMBIOS"}
        </Button>
      </CardContent>
    </Card>
  );
}
