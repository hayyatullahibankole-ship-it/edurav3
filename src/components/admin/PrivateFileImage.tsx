import { useEffect, useState } from "react";
import { getSignedFileUrl } from "@/lib/storageUrls";

interface Props {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
}

/** Renders an image stored in a private bucket using a short-lived signed link. */
export default function PrivateFileImage({ bucket, path, alt, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    getSignedFileUrl(bucket, path).then((signed) => {
      if (!active) return;
      if (signed) setUrl(signed);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [bucket, path]);

  if (!path) return null;
  if (failed) return <p className="text-sm text-slate-400">This file is no longer available.</p>;
  if (!url) return <p className="text-sm text-slate-400">Loading file…</p>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      <img src={url} alt={alt} className={className} onError={() => setFailed(true)} />
    </a>
  );
}
