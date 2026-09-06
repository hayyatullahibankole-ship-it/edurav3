import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  QuestionMediaItem,
  normalizeQuestionMedia,
  uploadQuestionMedia,
} from "@/lib/questionMedia";
import { QuestionMedia } from "@/components/questions/QuestionMedia";

const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  value: any;
  onChange: (items: QuestionMediaItem[]) => void;
  label?: string;
  multiple?: boolean;
  compact?: boolean;
}

export const QuestionMediaUploader = ({
  value,
  onChange,
  label = "Diagrams / images",
  multiple = true,
  compact = false,
}: Props) => {
  const items = normalizeQuestionMedia(value);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = multiple ? Array.from(files) : [files[0]];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: QuestionMediaItem[] = [];
      for (const file of selected) {
        const path = await uploadQuestionMedia(file);
        uploaded.push({ url: path });
      }
      onChange(multiple ? [...items, ...uploaded] : uploaded);
      toast.success(uploaded.length > 1 ? "Images uploaded" : "Image uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Upload failed. Make sure you are signed in as an admin.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));

  const setCaption = (index: number, caption: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, caption } : item)));

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs sm:text-sm">{label}</Label>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed p-3 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : compact ? (
            <ImagePlus className="mr-2 h-4 w-4" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Uploading..." : multiple ? "Upload image(s)" : "Upload image"}
        </Button>
        {!compact && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Drag and drop also works. PNG or JPG, up to 10MB each.
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${item.url}-${index}`} className="rounded-lg border p-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <QuestionMedia media={[item]} zoomable={false} imageClassName="max-h-28" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAt(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {!compact && (
                <Input
                  value={item.caption || ""}
                  onChange={(e) => setCaption(index, e.target.value)}
                  placeholder="Caption (optional)"
                  className="mt-2 h-8 text-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionMediaUploader;
