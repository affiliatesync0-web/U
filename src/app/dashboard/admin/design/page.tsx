"use client"

import { useState, useRef, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Mail, 
  Loader2, 
  ImageIcon,
  Server,
  Upload,
  CreditCard,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser, initializeFirebase } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { testEmailConfig } from '@/lib/email'

export default function AdminDesignPage() {
  const { toast } = useToast()
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

  const handleSaveValue = (id: string, data: any) => {
    const configRef = doc(db, 'site_config', id);
    setSavingId(id);
    setDocumentNonBlocking(configRef, { id, ...data, updatedAt: new Date().toISOString() }, { merge: true });
    setTimeout(() => {
      setSavingId(null);
      toast({ title: "Ajuste Guardado" });
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
      baseUrl: formData.get('baseUrl')?.toString().trim(),
      apiKey: formData.get('apiKey')?.toString().trim(),
      sessionName: formData.get('sessionName')?.toString().trim(),
    };
    handleSaveValue('whatsapp-api', data);
  };

  const handleTestEmail = async () => {
    if (!user?.email) return;
    setTestLoading(true);
    try {
      const res = await testEmailConfig(user.email);
      if (res.success) {
        toast({ title: "Email Enviado ✓" });
      } else {
        toast({ variant: "destructive", title: "Error SMTP", description: res.error });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Fallo en la conexión SMTP." });
    } finally {
      setTestLoading(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <DashboardShell role="admin"><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardShell>
  }

  const settings = overrides?.find(o => o.id === 'settings') || {};
  const waSettings = overrides?.find(o => o.id === 'whatsapp-api') || {};

  return (
    <DashboardShell role="admin">
      <div className="space-y-12 pb-20">
        <h1 className="text-4xl font-headline font-black text-slate-900">Infraestructura & <span className="text-primary">Configuración</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Card className="premium-card p-10">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3"><Mail className="h-6 w-6 text-primary" /> Gmail SMTP</h3>
            <form onSubmit={handleSaveSmtp} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Host</Label>
                  <Input name="smtp_host" defaultValue={settings.smtp_host || 'smtp.gmail.com'} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Puerto</Label>
                  <Input name="smtp_port" defaultValue={settings.smtp_port || '465'} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Usuario Gmail</Label>
                <Input name="smtp_user" defaultValue={settings.smtp_user} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Pass Aplicación</Label>
                <Input name="smtp_password" type="password" defaultValue={settings.smtp_password} className="font-mono" />
              </div>
              <div className="flex gap-4">
                 <Button type="button" onClick={handleTestEmail} variant="outline" className="flex-1 font-black" disabled={testLoading}>PROBAR</Button>
                 <Button type="submit" className="flex-[2] bg-slate-900 text-white font-black" disabled={savingId === 'settings'}>GUARDAR</Button>
              </div>
            </form>
          </Card>

          <Card className="premium-card p-10">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3"><MessageSquare className="h-6 w-6 text-green-500" /> WhatsApp API</h3>
            <form onSubmit={handleSaveOpenWa} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Base URL</Label>
                <Input name="baseUrl" defaultValue={waSettings.baseUrl} placeholder="http://..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">API Key</Label>
                <Input name="apiKey" defaultValue={waSettings.apiKey} className="font-mono" />
              </div>
              <Button type="submit" className="w-full bg-green-600 text-white font-black uppercase" disabled={savingId === 'whatsapp-api'}>CONECTAR</Button>
            </form>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
