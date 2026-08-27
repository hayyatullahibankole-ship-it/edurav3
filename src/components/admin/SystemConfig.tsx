import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type SettingsShape = {
  site_name: string;
  site_description: string;
  admin_email: string;
  support_whatsapp: string;
  timezone: string;
  default_exam_duration: number;
  max_attempts: number;
  passing_score: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  enable_anti_cheat: boolean;
  browser_lock_mode: boolean;
  screenshot_prevention: boolean;
  session_timeout: number;
  max_login_attempts: number;
  enable_email_notifications: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
};

const DEFAULTS: SettingsShape = {
  site_name: 'Edura',
  site_description: 'Computer-based testing and educational services platform',
  admin_email: 'support@edura.com.ng',
  support_whatsapp: '+2347050757085',
  timezone: 'Africa/Lagos',
  default_exam_duration: 120,
  max_attempts: 3,
  passing_score: 50,
  shuffle_questions: true,
  shuffle_options: true,
  enable_anti_cheat: true,
  browser_lock_mode: true,
  screenshot_prevention: true,
  session_timeout: 30,
  max_login_attempts: 5,
  enable_email_notifications: true,
  maintenance_mode: false,
  maintenance_message: 'System is under maintenance. Please try again later.',
};

const DESCRIPTIONS: Record<keyof SettingsShape, string> = {
  site_name: 'Platform name',
  site_description: 'Platform description',
  admin_email: 'Administrator email',
  support_whatsapp: 'Support WhatsApp number',
  timezone: 'Default timezone',
  default_exam_duration: 'Default exam duration in minutes',
  max_attempts: 'Maximum exam attempts',
  passing_score: 'Default passing percentage',
  shuffle_questions: 'Shuffle questions in exams',
  shuffle_options: 'Shuffle answer options',
  enable_anti_cheat: 'Enable anti-cheat monitoring',
  browser_lock_mode: 'Enable browser lock mode',
  screenshot_prevention: 'Prevent screenshots',
  session_timeout: 'Session timeout in minutes',
  max_login_attempts: 'Maximum failed login attempts',
  enable_email_notifications: 'Enable email notifications',
  maintenance_mode: 'Enable maintenance mode',
  maintenance_message: 'Maintenance message',
};

const coerce = (key: keyof SettingsShape, raw: any) => {
  const fallback = DEFAULTS[key];
  if (raw === null || raw === undefined) return fallback;
  if (typeof fallback === 'boolean') return raw === true || raw === 'true';
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  return String(raw);
};

export default function SystemConfig() {
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) {
      console.error('settings load failed', error);
      setLoadError(error.message);
      toast.error('Could not load settings');
      setLoading(false);
      return;
    }
    setLoadError(null);
    const map = new Map((data || []).map((row: any) => [row.key, row.value]));
    setSettings((prev) => {
      const next = { ...prev };
      (Object.keys(DEFAULTS) as (keyof SettingsShape)[]).forEach((key) => {
        if (map.has(key)) (next as any)[key] = coerce(key, map.get(key));
      });
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    const rows = (Object.keys(DEFAULTS) as (keyof SettingsShape)[]).map((key) => ({
      key,
      value: settings[key] as any,
      description: DESCRIPTIONS[key],
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);

    if (error) {
      console.error('settings save failed', error);
      toast.error(`Could not save settings: ${error.message}`);
      return;
    }
    toast.success('Settings saved');
    load();
  };

  const numberField = (
    key: keyof SettingsShape,
    label: string,
    opts: { min?: number; max?: number } = {}
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type="number"
        min={opts.min}
        max={opts.max}
        value={settings[key] as number}
        onChange={(e) => set(key, (Number(e.target.value) || 0) as any)}
      />
    </div>
  );

  const toggleRow = (key: keyof SettingsShape, title: string, help: string) => (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{help}</p>
      </div>
      <Switch checked={settings[key] as boolean} onCheckedChange={(v) => set(key, v as any)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">Platform configuration stored in the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading || saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
          <Button size="sm" onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900">Platform details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="site_name">Platform name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => set('site_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin_email">Admin email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={settings.admin_email}
                      onChange={(e) => set('admin_email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="site_description">Description</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description}
                    onChange={(e) => set('site_description', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="support_whatsapp">Support WhatsApp</Label>
                    <Input
                      id="support_whatsapp"
                      value={settings.support_whatsapp}
                      onChange={(e) => set('support_whatsapp', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => set('timezone', e.target.value)}
                    />
                  </div>
                </div>
                {toggleRow(
                  'enable_email_notifications',
                  'Email notifications',
                  'Send automated emails (welcome, receipts, reminders)'
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900">Exam defaults</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {numberField('default_exam_duration', 'Duration (minutes)', { min: 5, max: 600 })}
                  {numberField('max_attempts', 'Max attempts', { min: 1, max: 20 })}
                  {numberField('passing_score', 'Passing score (%)', { min: 1, max: 100 })}
                </div>
                {toggleRow('shuffle_questions', 'Shuffle questions', 'Randomise question order per candidate')}
                {toggleRow('shuffle_options', 'Shuffle options', 'Randomise answer option order')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900">Security controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {toggleRow('enable_anti_cheat', 'Anti-cheat monitoring', 'Track tab switches, focus loss and copy attempts')}
                {toggleRow('browser_lock_mode', 'Browser lock mode', 'Restrict navigation during an exam')}
                {toggleRow('screenshot_prevention', 'Screenshot prevention', 'Discourage screen capture during exams')}
                <div className="grid gap-4 md:grid-cols-2">
                  {numberField('session_timeout', 'Session timeout (minutes)', { min: 5, max: 480 })}
                  {numberField('max_login_attempts', 'Max login attempts', { min: 3, max: 20 })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900">Maintenance mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.maintenance_mode && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Maintenance mode is enabled. Remember to turn it off once you are done.
                    </AlertDescription>
                  </Alert>
                )}
                {toggleRow('maintenance_mode', 'Enable maintenance mode', 'Show a maintenance notice to users')}
                <div className="space-y-1.5">
                  <Label htmlFor="maintenance_message">Maintenance message</Label>
                  <Textarea
                    id="maintenance_message"
                    value={settings.maintenance_message}
                    onChange={(e) => set('maintenance_message', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
