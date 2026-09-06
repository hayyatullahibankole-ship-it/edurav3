import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, Eye, RefreshCw, Database, AlertTriangle, CheckCircle, PlugZap } from 'lucide-react';

/** Reads the real error message returned by the edge function body. */
async function readFunctionError(error: any, fallback: string): Promise<string> {
  try {
    const res = error?.context;
    if (res && typeof res.json === 'function') {
      const body = await res.clone().json();
      if (body?.error) {
        return Array.isArray(body.details) && body.details.length
          ? `${body.error}`
          : String(body.error);
      }
    }
    if (res && typeof res.text === 'function') {
      const text = await res.clone().text();
      if (text) return text.slice(0, 300);
    }
  } catch {
    // ignore parse issues and fall through
  }
  return error?.message || fallback;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Mapping {
  id: string;
  provider: string;
  exam_body: string;
  external_subject_name: string;
  edura_subject_id: string;
}

interface SyncLog {
  id: string;
  provider: string;
  exam_body: string;
  year: number | null;
  requested_count: number;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  status: string;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

const EXAM_BODIES = ['JAMB', 'WAEC', 'NECO', 'POST_UTME'];
const PROVIDERS = [
  { value: 'aloc', label: 'ALOC (recommended)' },
  { value: 'sdashapi', label: 'SdashAPI' },
];

export default function ExternalQuestionImport() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  const [provider, setProvider] = useState('aloc');
  const [examBody, setExamBody] = useState('JAMB');
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [limit, setLimit] = useState(50);
  const [dryRun, setDryRun] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
    fetchLogs();
    fetchDailyCount();
  }, []);

  useEffect(() => {
    if (subjectId) {
      fetchMappings();
    }
  }, [subjectId, provider, examBody]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name, code').eq('is_active', true).order('name');
    setSubjects(data || []);
    if (data && data.length > 0 && !subjectId) {
      setSubjectId(data[0].id);
    }
  };

  const fetchMappings = async () => {
    const { data } = await supabase
      .from('external_question_mappings')
      .select('*')
      .eq('provider', provider)
      .eq('exam_body', examBody)
      .eq('edura_subject_id', subjectId)
      .eq('is_active', true);
    setMappings(data || []);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('external_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);
    setLogs(data || []);
  };

  const fetchDailyCount = async () => {
    const { data } = await supabase.rpc('get_daily_import_count', { _provider: 'aloc' });
    setDailyCount(Number(data) || 0);
  };

  const runSync = async (isPreview: boolean) => {
    if (!subjectId) {
      toast({ title: 'Select a subject', variant: 'destructive' });
      return;
    }

    if (isPreview) {
      setPreviewLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('sync-external-questions', {
        body: {
          provider,
          exam_body: examBody,
          subject_id: subjectId,
          year,
          limit: isPreview ? 5 : limit,
          dry_run: isPreview,
        },
      });

      if (error) {
        throw new Error(await readFunctionError(error, 'Sync failed'));
      }

      if ((data as any)?.error) {
        throw new Error(String((data as any).error));
      }

      setLastError(null);

      if (isPreview) {
        setPreview(data?.preview || []);
        toast({ title: 'Preview loaded', description: `${data?.total || 0} questions available` });
      } else {
        toast({
          title: 'Import completed',
          description: `Imported ${data?.imported_count || 0}, skipped ${data?.skipped_count || 0}, errors ${data?.error_count || 0}`,
        });
        setPreview([]);
      }

      fetchLogs();
      fetchDailyCount();
    } catch (err) {
      console.error('Sync error:', err);
      setLastError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: isPreview ? 'Preview failed' : 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setPreviewLoading(false);
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-external-questions', {
        body: {
          provider,
          exam_body: examBody,
          provider_subject: mappings[0]?.external_subject_name || 'english',
          action: 'test_connection',
        },
      });

      if (error) throw new Error(await readFunctionError(error, 'Connection test failed'));
      if ((data as any)?.error) throw new Error(String((data as any).error));

      setLastError(null);
      toast({
        title: 'Connection OK',
        description: (data as any)?.message || `${provider} responded successfully.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLastError(message);
      toast({ title: 'Connection failed', description: message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const mapping = mappings[0];
  const dailyCap = 1000;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Questions from External API
          </CardTitle>
          <CardDescription>
            Pull JAMB, WAEC, NECO, and Post-UTME questions from ALOC or SdashAPI directly into the Edura question bank.
            The mobile app and exam UI do not change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Imported questions are cached in the Edura database. Exams remain fast and offline-resilient.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Exam Body</Label>
              <Select value={examBody} onValueChange={setExamBody}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_BODIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Edura Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2001}
                max={2030}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Batch Size (max 100)</Label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Math.min(100, Math.max(1, Number(e.target.value))))}
                min={1}
                max={100}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              <Label htmlFor="dry-run" className="cursor-pointer">
                Dry run (do not save)
              </Label>
            </div>
          </div>

          {currentSubject && mapping && (
            <div className="text-sm text-muted-foreground">
              Mapping: <Badge variant="secondary">{provider}</Badge> {mapping.external_subject_name} →{' '}
              <Badge variant="outline">{currentSubject.name}</Badge>
            </div>
          )}

          {!mapping && currentSubject && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No subject mapping found for {provider} + {examBody}. Please create one in the database or contact support.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => runSync(true)}
              disabled={previewLoading || loading || !subjectId}
            >
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button
              onClick={() => runSync(false)}
              disabled={previewLoading || loading || !subjectId || dryRun}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Import {limit} Questions
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={testing || loading || previewLoading}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlugZap className="h-4 w-4 mr-2" />}
              Test connection
            </Button>
            <Button variant="ghost" onClick={() => { fetchLogs(); fetchDailyCount(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {lastError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="break-words">{lastError}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            Daily import cap: {dailyCount} / {dailyCap} questions used today.
          </div>

          {preview.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium">Preview</h4>
              {preview.map((q, idx) => (
                <div key={idx} className="text-sm space-y-1">
                  <p className="font-medium">{idx + 1}. {q.question_text}</p>
                  <ul className="pl-4 list-disc text-muted-foreground">
                    {q.options?.map((opt: string, i: number) => (
                      <li key={i} className={i === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Recent sync runs and their results.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Started</th>
                    <th className="text-left py-2">Provider</th>
                    <th className="text-left py-2">Exam</th>
                    <th className="text-left py-2">Year</th>
                    <th className="text-left py-2">Requested</th>
                    <th className="text-left py-2">Imported</th>
                    <th className="text-left py-2">Skipped</th>
                    <th className="text-left py-2">Errors</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2">{new Date(log.started_at).toLocaleString()}</td>
                      <td className="py-2 capitalize">{log.provider}</td>
                      <td className="py-2">{log.exam_body}</td>
                      <td className="py-2">{log.year || '-'}</td>
                      <td className="py-2">{log.requested_count}</td>
                      <td className="py-2">{log.imported_count}</td>
                      <td className="py-2">{log.skipped_count}</td>
                      <td className="py-2">{log.error_count}</td>
                      <td className="py-2">
                        <Badge
                          variant={
                            log.status === 'completed'
                              ? 'default'
                              : log.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1 max-w-xs break-words">{log.error_message}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
