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
  AlertTriangle, 
  Check, 
  Copy, 
  RefreshCw, 
  Loader2, 
  Zap, 
  Smartphone, 
  Facebook, 
  Instagram, 
  Star,
  Image as ImageIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { testEmailConfig } from '@/lib/email'

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
        title: t.saveChanges,
        description: "La configuración se ha actualizado correctamente.",
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
        title: t.saveChanges,
        description: "Se ha actualizado el valor de configuración.",
      });
    }, 1000);
  };

  const handleSaveSmtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      smtp_host: formData.get('smtp_host'),
      smtp_port: formData.get('smtp_port'),
      smtp_user: formData.get('smtp_user'),
      smtp_password: formData.get('smtp_password'),
      smtp_from_email: formData.get('smtp_from_email'),
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
        description: "Los ajustes de correo han sido actualizados.",
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
        toast({ title: "Correo Enviado", description: `Revisa la bandeja de entrada de ${emailToTest} para confirmar.` });
      } else {
        toast({ variant: "destructive", title: "Error en la prueba", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de conexión", description: "No se pudo contactar con el servidor de correos." });
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado", description: `${field} listo para pegar en Firebase.` });
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
          <div>
            <h1 className="text-4xl font-headline font-black text-primary mb-2">Identidad & Configuración</h1>
            <p className="text-muted-foreground">Personaliza tu marca y configura las comunicaciones del sistema.</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
             <ShieldCheck className="h-5 w-5 text-primary" />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Conexión Segura</span>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-slate-900 text-white p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary shadow-2xl rotate-3">
                  <Mail className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-headline font-black text-white">Configuración de Correo (SMTP)</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                    Define la cuenta que enviará todos los correos del sistema
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
                Probar Configuración
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSaveSmtp} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Servidor SMTP</Label>
                  <Input name="smtp_host" defaultValue={settings.smtp_host || 'smtp.gmail.com'} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Puerto</Label>
                  <Input name="smtp_port" defaultValue={settings.smtp_port || '465'} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Usuario (Email)</Label>
                  <Input name="smtp_user" defaultValue={settings.smtp_user || 'affiliatesync0@gmail.com'} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Contraseña de Aplicación</Label>
                  <Input name="smtp_password" type="password" defaultValue={settings.smtp_password || 'wagrmuphptnevpin'} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Email Remitente (De:)</Label>
                  <Input name="smtp_from_email" defaultValue={settings.smtp_from_email || 'affiliatesync0@gmail.com'} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nombre Remitente</Label>
                  <Input name="smtp_from_name" defaultValue={settings.smtp_from_name || 'Sync Connect'} className="h-12 rounded-xl" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg" disabled={savingId === 'smtp'}>
                {savingId === 'smtp' ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Guardar Cambios SMTP"}
              </Button>
            </form>

            <div className="mt-12 p-8 rounded-[3rem] bg-blue-50/50 border border-blue-100 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Zap className="h-40 w-40 text-blue-500" />
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                 <div className="flex items-center gap-5">
                   <div className="h-14 w-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 -rotate-3">
                     <RefreshCw className="h-8 w-8" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-blue-900 tracking-tight">Sincronizador de Firebase</h3>
                     <p className="text-xs text-blue-700 font-bold uppercase tracking-widest">Configura la recuperación de contraseña en la consola de Firebase</p>
                   </div>
                 </div>
                 <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-blue-200">
                   <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer">
                     <ExternalLink className="h-4 w-4 mr-2" /> Abrir Consola Firebase
                   </a>
                 </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                 {[
                   { label: "Servidor SMTP", value: "smtp.gmail.com" },
                   { label: "Puerto / SSL", value: "465" },
                   { label: "Usuario SMTP", value: settings.smtp_user || 'affiliatesync0@gmail.com' },
                   { label: "Clave SMTP", value: settings.smtp_password || 'wagrmuphptnevpin' },
                 ].map((field) => (
                   <div key={field.label} className="p-6 bg-white rounded-[1.5rem] border border-blue-100 shadow-sm flex flex-col justify-between group hover:scale-[1.02] transition-all">
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">{field.label}</p>
                     <div className="flex items-center justify-between gap-2">
                       <code className="text-xs font-bold text-blue-900 truncate">{field.value}</code>
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

               <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-5 relative z-10">
                 <div className="h-10 w-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                   <AlertTriangle className="h-5 w-5" />
                 </div>
                 <div className="space-y-2">
                   <p className="text-xs text-amber-800 font-black uppercase tracking-widest">⚠️ REQUISITO DE SEGURIDAD:</p>
                   <p className="text-sm text-amber-800 font-medium leading-relaxed">
                     Para que Google permita enviar el link desde tu Gmail, debes marcar <strong>"SSL"</strong> y usar el puerto <strong>465</strong> en la consola de Firebase. Además, asegúrate de haber generado una <strong>Contraseña de Aplicación</strong> en tu cuenta de Google.
                   </p>
                 </div>
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
                <CardTitle className="text-2xl font-headline font-black text-slate-900">WhatsApp de Soporte</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Número de WhatsApp</Label>
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
                <CardTitle className="text-2xl font-headline font-black text-white">Redes Sociales</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook URL</Label>
                  <Input 
                    placeholder="https://facebook.com/tu-pagina" 
                    defaultValue={overrides?.find(o => o.id === 'social-facebook')?.value}
                    onBlur={(e) => handleSaveValue('social-facebook', e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary transition-all px-4 text-xs font-medium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram URL</Label>
                  <Input 
                    placeholder="https://instagram.com/tu-perfil" 
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
            <h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight">Galería de Imágenes</h2>
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
              placeholder="https://..." 
              className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Concepto IA</Label>
            <Input 
              value={hint} 
              onChange={(e) => setHint(e.target.value)} 
              placeholder="Ej: network business" 
              className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-medium"
            />
          </div>
        </div>
        <Button 
          onClick={() => onSave(id, url, hint)} 
          className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Identidad"}
        </Button>
      </CardContent>
    </Card>
  );
}
