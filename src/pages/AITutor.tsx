import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, Plus, Trash2, Pencil, MessageSquare, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AITutorChat } from "@/components/ai/AITutorChat";
import type { TutorThread } from "@/lib/aiTutor";
import AppShell from "@/components/edura/AppShell";
import { useAcademicStage } from "@/hooks/useAcademicStage";

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const AITutor = () => {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isCampus } = useAcademicStage();
  const { toast } = useToast();

  const [threads, setThreads] = useState<TutorThread[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    document.title = "AI Tutor | Edura";
  }, []);

  const loadThreads = useCallback(async () => {
    if (!user) {
      setBootstrapped(true);
      return [] as TutorThread[];
    }
    const { data, error } = await supabase
      .from("ai_tutor_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Failed to load tutor threads:", error);
      setBootstrapped(true);
      return [] as TutorThread[];
    }
    const rows = (data || []) as TutorThread[];
    setThreads(rows);
    setBootstrapped(true);
    return rows;
  }, [user]);

  // Open the most recent conversation when landing on /ai-tutor
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await loadThreads();
      if (cancelled || threadId || !rows.length) return;
      navigate(`/ai-tutor/${rows[0].id}`, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNewChat = () => {
    setHistoryOpen(false);
    navigate("/ai-tutor");
  };

  const handleSelect = (id: string) => {
    setHistoryOpen(false);
    navigate(`/ai-tutor/${id}`);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ai_tutor_threads").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete chat", description: error.message, variant: "destructive" });
      return;
    }
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (id === threadId) navigate("/ai-tutor", { replace: true });
  };

  const handleRename = async (thread: TutorThread) => {
    const title = window.prompt("Rename this chat", thread.title)?.trim();
    if (!title) return;
    const { error } = await supabase.from("ai_tutor_threads").update({ title }).eq("id", thread.id);
    if (error) {
      toast({ title: "Couldn't rename chat", description: error.message, variant: "destructive" });
      return;
    }
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, title } : t)));
  };

  const handleThreadCreated = (id: string) => {
    navigate(`/ai-tutor/${id}`, { replace: true });
    loadThreads();
  };

  const ThreadList = () => (
    <div className="flex h-full flex-col">
      <Button onClick={handleNewChat} className="mb-3 w-full justify-start gap-2">
        <Plus className="h-4 w-4" /> New chat
      </Button>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {!user && <p className="px-2 py-6 text-xs text-muted-foreground">Sign in to keep your chat history.</p>}
        {user && bootstrapped && threads.length === 0 && (
          <p className="px-2 py-6 text-xs text-muted-foreground">No saved chats yet.</p>
        )}
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`group flex items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
              thread.id === threadId ? "bg-accent" : "hover:bg-accent/60"
            }`}
          >
            <button onClick={() => handleSelect(thread.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{thread.title}</span>
                <span className="block text-[11px] text-muted-foreground">{relativeTime(thread.updated_at)}</span>
              </span>
            </button>
            <button
              onClick={() => handleRename(thread)}
              className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
              aria-label="Rename chat"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(thread.id)}
              className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-destructive group-hover:opacity-100"
              aria-label="Delete chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell side={isCampus ? "campus" : "cbt"} title="AI Tutor" subtitle="Ask questions and continue saved chats">
    <div className="flex h-[calc(100dvh-9.5rem)] min-h-[32rem] w-full overflow-hidden rounded-lg border bg-background lg:h-[calc(100dvh-10rem)]">
      {/* Desktop thread sidebar */}
      {!isMobile && (
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 p-3 md:flex">
          <ThreadList />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-t-0 border-b border-border px-3 py-3 sm:px-5">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight">Edura AI Tutor</h1>
              <p className="text-[11px] text-muted-foreground">Always available to explain</p>
            </div>
          </div>

          {isMobile ? (
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <History className="h-4 w-4" /> History
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-4">
                <SheetHeader className="mb-3">
                  <SheetTitle>Your chats</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100dvh-6rem)]">
                  <ThreadList />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleNewChat}>
              <Plus className="h-4 w-4" /> New chat
            </Button>
          )}
        </header>

        <div className="min-h-0 flex-1">
          <AITutorChat
            key={threadId ?? "new"}
            threadId={threadId ?? null}
            onThreadCreated={handleThreadCreated}
            onThreadTouched={loadThreads}
          />
        </div>
      </div>
    </div>
    </AppShell>
  );
};

export default AITutor;
