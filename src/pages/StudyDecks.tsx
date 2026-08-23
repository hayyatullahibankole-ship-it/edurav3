import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Layers, Loader2, Trash2 } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Panel, EmptyState } from "@/components/edura/tiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAcademicStage } from "@/hooks/useAcademicStage";
import { supabase } from "@/integrations/supabase/client";
import {
  buildSection,
  chunkText,
  createDeck,
  extractPdfText,
  finishDeck,
  uploadDeckFile,
  type StudyDeck,
} from "@/lib/studyDecks";

const StudyDecks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isCampus } = useAcademicStage();
  const [decks, setDecks] = useState<StudyDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("study_decks")
      .select("*")
      .order("created_at", { ascending: false });
    setDecks((data as StudyDeck[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please choose a PDF file.", variant: "destructive" });
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast({ title: "File too large", description: "Keep the PDF under 25MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, "").slice(0, 80));
  };

  const build = async () => {
    if (!file || !title.trim() || !user) return;
    setBusy(true);
    setProgress(2);
    let deckId: string | null = null;
    try {
      setStep("Reading your PDF…");
      const { text, pageCount } = await extractPdfText(file, (page, total) =>
        setProgress(Math.round((page / total) * 25)),
      );
      if (text.length < 400) {
        throw new Error("This PDF has no readable text (it may be a scan of images).");
      }

      const chunks = chunkText(text);
      setStep("Creating your deck…");
      const deck = await createDeck({
        title: title.trim(),
        pageCount,
        passMark: 70,
      });
      deckId = deck.id;

      try {
        const path = await uploadDeckFile(user.id, deck.id, file);
        await supabase.from("study_decks").update({ source_path: path }).eq("id", deck.id);
      } catch (uploadErr) {
        console.warn("Deck file upload skipped:", uploadErr);
      }

      for (let i = 0; i < chunks.length; i++) {
        setStep(`Building section ${i + 1} of ${chunks.length}…`);
        await buildSection(deck.id, i, chunks[i]);
        setProgress(25 + Math.round(((i + 1) / chunks.length) * 70));
      }

      await finishDeck(deck.id);
      setProgress(100);
      toast({ title: "Deck ready", description: `${chunks.length} sections with quizzes.` });
      navigate(`/decks/${deck.id}`);
    } catch (err: any) {
      if (deckId) await finishDeck(deckId, true, err?.message).catch(() => {});
      toast({
        title: "Could not build the deck",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
      load();
    } finally {
      setBusy(false);
      setStep("");
      setFile(null);
      setTitle("");
    }
  };

  const remove = async (id: string) => {
    await supabase.from("study_decks").delete().eq("id", id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <AppShell
      side={isCampus ? "campus" : "cbt"}
      title="Study Decks"
      subtitle="Turn any PDF into sections with a quiz gate on each one"
    >
      <div className="space-y-6">
        <Panel title="New deck">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deck-title">Deck title</Label>
              <Input
                id="deck-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Biology — Cell Structure notes"
                disabled={busy}
              />
            </div>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center ${
                busy ? "pointer-events-none opacity-60" : "hover:bg-muted/40"
              }`}
            >
              <FileUp className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">
                {file ? file.name : "Choose a PDF (lecture note, textbook chapter)"}
              </span>
              <span className="text-xs text-muted-foreground">Max 25MB · text-based PDFs only</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {busy && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {step}
                </p>
              </div>
            )}

            <Button onClick={build} disabled={busy || !file || !title.trim()} className="w-full">
              {busy ? "Building…" : "Build deck"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Each section ends with a quiz. Score {`70%`} or more to unlock the next section.
            </p>
          </div>
        </Panel>

        <Panel title="Your decks">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : decks.length === 0 ? (
            <EmptyState>
              No decks yet — upload your first PDF above and Edura will break it into sections with
              quizzes.
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => navigate(`/decks/${deck.id}`)}
                  >
                    <p className="truncate text-sm font-semibold">{deck.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {deck.section_count} sections · pass mark {deck.pass_mark}%
                    </p>
                  </button>
                  <Badge variant={deck.status === "ready" ? "secondary" : "outline"}>
                    {deck.status}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => remove(deck.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
};

export default StudyDecks;
