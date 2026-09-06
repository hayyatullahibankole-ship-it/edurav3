import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Wifi, WifiOff, Check, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OfflineDownload {
  id: string;
  exam_type: string;
  subject_ids: string[];
  questions_data: any;
  download_date: string;
  expires_at: string;
}

export const OfflineModeCard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [downloads, setDownloads] = useState<OfflineDownload[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloading, setDownloading] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState<string>("jamb");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchDownloads();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchDownloads = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('offline_downloads')
        .select('*')
        .eq('user_id', userProfile.id)
        .gt('expires_at', new Date().toISOString())
        .order('download_date', { ascending: false });

      if (error) throw error;
      const downloadsData = (data || []).map(d => ({
        ...d,
        subject_ids: d.subject_ids as any as string[],
        questions_data: d.questions_data as any,
      }));
      setDownloads(downloadsData);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    }
  };

  const downloadForOffline = async () => {
    if (!userProfile?.id) return;

    try {
      setDownloading(true);

      // Fetch questions for the selected exam type
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          exam_subjects (
            subject_id,
            question_count
          )
        `)
        .eq('type', selectedExamType as any)
        .eq('is_published', true)
        .single();

      if (examError) throw examError;

      const subjectIds = examData.exam_subjects.map((es: any) => es.subject_id);
      
      // Get random questions (without answers)
      const { data: questions, error: questionsError } = await supabase
        .rpc('get_random_questions_for_subjects', {
          subject_ids: subjectIds,
          per_subject_count: 10,
          target_exam_body: normalizeExamBody(selectedExamType) ?? undefined,
        });

      if (questionsError) throw questionsError;

      // Store download record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error: insertError } = await supabase
        .from('offline_downloads')
        .insert([{
          user_id: userProfile.id,
          exam_type: selectedExamType as any,
          subject_ids: subjectIds as any,
          questions_data: questions as any,
          expires_at: expiresAt.toISOString(),
        }]);

      if (insertError) throw insertError;

      // Store in IndexedDB for offline access
      if ('indexedDB' in window) {
        const dbRequest = indexedDB.open('EduraOfflineDB', 1);
        
        dbRequest.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['questions'], 'readwrite');
          const store = transaction.objectStore('questions');
          
          store.put({
            id: `${selectedExamType}-${Date.now()}`,
            examType: selectedExamType,
            questions: questions,
            downloadedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
          });
        };

        dbRequest.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('questions')) {
            db.createObjectStore('questions', { keyPath: 'id' });
          }
        };
      }

      await fetchDownloads();

      toast({
        title: "Download Complete!",
        description: `${questions.length} questions downloaded for offline practice.`,
      });
    } catch (error) {
      console.error('Error downloading for offline:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const deleteDownload = async (downloadId: string) => {
    try {
      const { error } = await supabase
        .from('offline_downloads')
        .delete()
        .eq('id', downloadId);

      if (error) throw error;

      setDownloads(prev => prev.filter(d => d.id !== downloadId));

      toast({
        title: "Download Removed",
        description: "Offline download has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  return (
    <Card className="border border-border bg-card overflow-hidden hover-lift">
      <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Download className="h-5 w-5" />
              Offline Mode
            </CardTitle>
            <CardDescription>Practice anywhere, anytime</CardDescription>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Download Section */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-semibold">Download Practice Tests</p>
          <Select value={selectedExamType} onValueChange={setSelectedExamType}>
            <SelectTrigger>
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jamb">JAMB</SelectItem>
              <SelectItem value="waec">WAEC</SelectItem>
              <SelectItem value="neco">NECO</SelectItem>
              <SelectItem value="post-utme">Post-UTME</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={downloadForOffline} 
            disabled={downloading || !isOnline}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Downloading..." : "Download for Offline"}
          </Button>
          {!isOnline && (
            <p className="text-xs text-muted-foreground text-center">
              Connect to internet to download
            </p>
          )}
        </div>

        {/* Downloaded Tests */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Downloaded Tests ({downloads.length})</p>
          
          {downloads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No offline downloads yet
            </p>
          ) : (
            downloads.map((download) => (
              <div 
                key={download.id}
                className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-success" />
                  <div>
                    <p className="font-semibold text-sm uppercase">{download.exam_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {JSON.parse(download.questions_data as any).length} questions
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDownload(download.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div className="p-3 bg-info/10 rounded-lg text-sm text-muted-foreground">
          💡 Downloads expire after 7 days. Answers are revealed only after submission.
        </div>
      </CardContent>
    </Card>
  );
};
