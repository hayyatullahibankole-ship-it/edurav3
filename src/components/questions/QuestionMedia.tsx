import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageOff, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QuestionMediaItem,
  normalizeQuestionMedia,
  resolveQuestionMediaUrl,
} from "@/lib/questionMedia";

interface SingleProps {
  item: QuestionMediaItem;
  className?: string;
  imageClassName?: string;
  zoomable?: boolean;
}

const MediaImage = ({ item, className, imageClassName, zoomable = true }: SingleProps) => {
  const [src, setSrc] = useState<string>("");
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    resolveQuestionMediaUrl(item.url)
      .then((url) => {
        if (!active) return;
        if (!url) setFailed(true);
        setSrc(url);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [item.url]);

  if (failed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <ImageOff className="h-4 w-4" /> Diagram unavailable
      </div>
    );
  }

  return (
    <figure className={cn("space-y-1", className)}>
      <button
        type="button"
        onClick={() => zoomable && src && setOpen(true)}
        className={cn(
          "group relative block w-full overflow-hidden rounded-lg border bg-white",
          zoomable ? "cursor-zoom-in" : "cursor-default"
        )}
      >
        {src ? (
          <img
            src={src}
            alt={item.caption || "Question diagram"}
            loading="lazy"
            onError={() => setFailed(true)}
            className={cn("mx-auto max-h-[320px] w-auto max-w-full object-contain", imageClassName)}
          />
        ) : (
          <div className="h-32 w-full animate-pulse bg-muted" />
        )}
        {zoomable && src && (
          <span className="absolute bottom-1 right-1 rounded-md bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      {item.caption && (
        <figcaption className="text-center text-[11px] text-muted-foreground">{item.caption}</figcaption>
      )}

      {zoomable && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl p-2">
            {src && (
              <img
                src={src}
                alt={item.caption || "Question diagram"}
                className="max-h-[80vh] w-full object-contain"
              />
            )}
            {item.caption && (
              <p className="pb-2 text-center text-xs text-muted-foreground">{item.caption}</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </figure>
  );
};

interface QuestionMediaProps {
  media: any;
  className?: string;
  imageClassName?: string;
  zoomable?: boolean;
}

/** Renders all diagrams attached to a question. Safe with any stored shape. */
export const QuestionMedia = ({ media, className, imageClassName, zoomable = true }: QuestionMediaProps) => {
  const items = normalizeQuestionMedia(media);
  if (!items.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <MediaImage
          key={`${item.url}-${index}`}
          item={item}
          imageClassName={imageClassName}
          zoomable={zoomable}
        />
      ))}
    </div>
  );
};

/** Small thumbnail used beside an answer option. */
export const OptionMedia = ({ media, className }: { media: any; className?: string }) => {
  const items = normalizeQuestionMedia(media);
  if (!items.length) return null;
  return (
    <MediaImage
      item={items[0]}
      className={cn("mt-1.5 max-w-[180px]", className)}
      imageClassName="max-h-24"
    />
  );
};

export default QuestionMedia;
