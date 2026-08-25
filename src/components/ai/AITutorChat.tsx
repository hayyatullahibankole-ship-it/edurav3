import { useCallback, useEffect, useRef, useState } from "react";
import { Send, ImagePlus, Camera, Mic, MicOff, Copy, Check, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  renderTutorMarkdown,
  streamTutorReply,
  TUTOR_STARTERS,
  type TutorMessage,
} from "@/lib/aiTutor";

interface AITutorChatProps {
  threadId: string | null;
  onThreadCreated: (threadId: string) => void;
  onThreadTouched?: () => void;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const AITutorChat = ({ threadId, onThreadCreated, onThreadTouched }: AITutorChatProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSentRef = useRef<{ text: string; images: string[] } | null>(null);
  const shouldFollowRef = useRef(true);

  /* ---------- load history for the active thread ---------- */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!threadId || !user) {
        setMessages([]);
        return;
      }
      setLoadingHistory(true);
      const { data, error: loadError } = await supabase
        .from("ai_tutor_messages")
        .select("id, role, content, images")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (loadError) {
        console.error("Failed to load tutor history:", loadError);
        setError("Couldn't load this conversation.");
      } else {
        shouldFollowRef.current = true;
        setMessages(
          (data || []).map((row: any) => ({
            id: row.id,
            role: row.role === "assistant" ? "assistant" : "user",
            content: row.content ?? "",
            images: Array.isArray(row.images) ? row.images : [],
          })),
        );
        setError(null);
      }
      setLoadingHistory(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [threadId, user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldFollowRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, streaming]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [input]);

  /* ---------- persistence helpers ---------- */
  const ensureThread = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (!user) return null;
      if (threadId) return threadId;
      const title = firstMessage.trim().slice(0, 60) || "New chat";
      const { data, error: insertError } = await supabase
        .from("ai_tutor_threads")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (insertError || !data) {
        console.error("Failed to create thread:", insertError);
        return null;
      }
      onThreadCreated(data.id);
      return data.id;
    },
    [threadId, user, onThreadCreated],
  );

  const saveMessage = useCallback(
    async (activeThreadId: string | null, message: TutorMessage) => {
      if (!user || !activeThreadId) return;
      const { error: saveError } = await supabase.from("ai_tutor_messages").insert({
        thread_id: activeThreadId,
        user_id: user.id,
        role: message.role,
        content: message.content,
        images: message.images ?? [],
      });
      if (saveError) console.error("Failed to save message:", saveError);
      await supabase
        .from("ai_tutor_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeThreadId);
      onThreadTouched?.();
    },
    [user, onThreadTouched],
  );

  /* ---------- sending ---------- */
  const runTurn = useCallback(
    async (text: string, attached: string[]) => {
      setError(null);
      lastSentRef.current = { text, images: attached };

      const userMessage: TutorMessage = { role: "user", content: text, images: attached };
      const history = [...messages, userMessage];
      shouldFollowRef.current = true;
      setMessages(history);
      setStreaming(true);

      const activeThreadId = await ensureThread(text);
      await saveMessage(activeThreadId, userMessage);

      try {
        let streamed = "";
        setMessages([...history, { role: "assistant", content: "" }]);
        const full = await streamTutorReply(history, session?.access_token ?? null, (partial) => {
          streamed = partial;
          setMessages([...history, { role: "assistant", content: partial }]);
        });
        const finalText = full || streamed;
        setMessages([...history, { role: "assistant", content: finalText }]);
        await saveMessage(activeThreadId, { role: "assistant", content: finalText });
      } catch (err: any) {
        setMessages(history.slice(0, -1));
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        setStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [messages, ensureThread, saveMessage, session],
  );

  const handleSend = () => {
    const text = input.trim();
    if ((!text && images.length === 0) || streaming) return;
    setInput("");
    const attached = images;
    setImages([]);
    runTurn(text || "Please help me with this.", attached);
  };

  const handleRetry = () => {
    const last = lastSentRef.current;
    if (!last || streaming) return;
    runTurn(last.text, last.images);
  };

  /* ---------- attachments ---------- */
  const readFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .slice(0, 5 - images.length)
      .forEach((file) => {
        if (file.size > MAX_IMAGE_BYTES) {
          toast({ title: "Image too large", description: "Please use an image under 4MB.", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => setImages((prev) => [...prev, String(reader.result)]);
        reader.readAsDataURL(file);
      });
  };

  /* ---------- voice ---------- */
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice not supported", description: "Your device doesn't support voice input.", variant: "destructive" });
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(" ");
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const copyMessage = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const isEmpty = messages.length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Transcript */}
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          shouldFollowRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {loadingHistory && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {isEmpty && (
            <div className="py-8">
              <h2 className="text-2xl font-bold tracking-tight">How can I help you study today?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask anything about JAMB, WAEC or your coursework — you can also snap a question.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {TUTOR_STARTERS.map((starter) => (
                  <Button
                    key={starter.label}
                    variant="outline"
                    onClick={() => runTurn(starter.prompt, [])}
                    className="h-auto min-h-24 items-start justify-start whitespace-normal rounded-xl p-4 text-left hover:border-primary/50"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{starter.label}</span>
                      <span className="mt-1 line-clamp-2 block text-xs font-normal text-muted-foreground">{starter.prompt}</span>
                    </span>
                  </Button>
                ))}
              </div>
              {!user && (
                <p className="mt-6 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                  You're not signed in — this chat won't be saved. Sign in to keep your history.
                </p>
              )}
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLast = index === messages.length - 1;
            return (
              <div key={message.id ?? index} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div className={isUser ? "max-w-[85%]" : "w-full"}>
                  {isUser ? (
                    <div className="rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground">
                      {message.images && message.images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {message.images.map((src, i) => (
                            <img key={i} src={src} alt="Attached question" className="h-24 w-24 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <div className="group">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Edura AI
                      </p>
                      {message.content ? (
                        <>
                          <div
                            className="text-sm leading-relaxed text-foreground [&_pre]:whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: renderTutorMarkdown(message.content) }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyMessage(message.content, index)}
                            className="mt-2 h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                          >
                            {copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </Button>
                        </>
                      ) : (
                        isLast &&
                        streaming && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking…
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {error && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="flex-1 text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={handleRetry} disabled={streaming}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div
        className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-3xl">
          {images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="Attachment preview" className="h-16 w-16 rounded-lg object-cover" />
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2">
            <div className="flex items-center gap-0.5">
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => fileRef.current?.click()} aria-label="Attach image">
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => cameraRef.current?.click()} aria-label="Take photo">
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={`h-9 w-9 ${recording ? "text-destructive" : ""}`}
                onClick={toggleVoice}
                aria-label="Voice input"
              >
                {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Edura AI anything…"
              rows={1}
              className="max-h-32 min-h-[40px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
            />

            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={streaming || (!input.trim() && images.length === 0)}
              aria-label="Send message"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              readFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              readFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AITutorChat;
