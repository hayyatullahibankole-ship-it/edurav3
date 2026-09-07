import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ProctoringMode = 'off' | 'optional' | 'required';

export interface ProctoringEvent {
  type: 'tab_switch' | 'copy' | 'paste' | 'context_menu' | 'shortcut' | 'camera_lost';
  at: string;
}

interface UseProctoringOptions {
  mode: ProctoringMode;
  attemptId?: string | null;
  /** Called once the violation limit is reached (auto submit). */
  onViolationLimit?: () => void;
  violationLimit?: number;
  /** Seconds between camera snapshots. */
  snapshotIntervalSeconds?: number;
}

const SNAPSHOT_BUCKET = 'proctoring-snapshots';

export function useProctoring({
  mode,
  attemptId,
  onViolationLimit,
  violationLimit = 3,
  snapshotIntervalSeconds = 180,
}: UseProctoringOptions) {
  const enabled = mode !== 'off';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const limitFiredRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [granted, setGranted] = useState(!enabled);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [violations, setViolations] = useState(0);

  const logEvent = useCallback((type: ProctoringEvent['type']) => {
    setEvents(prev => [...prev, { type, at: new Date().toISOString() }].slice(-200));
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => undefined);
    }
    setCameraActive(true);
    setCameraError(null);
  }, []);

  const requestCamera = useCallback(async () => {
    if (!enabled) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      attachStream(stream);
      setGranted(true);
      return true;
    } catch (err: any) {
      const message =
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access to continue.'
          : err?.name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'Unable to start the camera. Please check your device settings.';
      setCameraError(message);
      setCameraActive(false);
      if (mode === 'optional') setGranted(true);
      return false;
    }
  }, [enabled, attachStream, mode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // Keep the preview element bound to the live stream when it mounts later.
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => undefined);
    }
  });

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Camera health watchdog
  useEffect(() => {
    if (!enabled || !cameraActive) return;
    const id = window.setInterval(() => {
      const live = streamRef.current?.getVideoTracks().some(t => t.readyState === 'live');
      if (!live) {
        setCameraActive(false);
        logEvent('camera_lost');
        toast.warning('Camera stopped. Please re-enable camera access.');
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [enabled, cameraActive, logEvent]);

  const captureSnapshot = useCallback(async () => {
    if (!enabled || !cameraActive || !videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth) return;
    const canvas = canvasRef.current ?? document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.6),
    );
    if (!blob) return;

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return; // anonymous exam sessions keep the camera but skip uploads
      const path = `${userId}/${attemptId || 'session'}/${Date.now()}.jpg`;
      await supabase.storage.from(SNAPSHOT_BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    } catch (err) {
      console.warn('Snapshot upload failed', err);
    }
  }, [enabled, cameraActive, attemptId]);

  // Periodic snapshots
  useEffect(() => {
    if (!enabled || !cameraActive) return;
    captureSnapshot();
    const id = window.setInterval(captureSnapshot, snapshotIntervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [enabled, cameraActive, captureSnapshot, snapshotIntervalSeconds]);

  // Anti-cheat listeners
  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (!document.hidden) return;
      logEvent('tab_switch');
      setViolations(prev => {
        const next = prev + 1;
        toast.warning(`Warning: leaving the exam screen was detected (${next}/${violationLimit}).`);
        return next;
      });
    };
    const block = (type: ProctoringEvent['type']) => (e: Event) => {
      e.preventDefault();
      logEvent(type);
    };
    const onCopy = block('copy');
    const onPaste = block('paste');
    const onContext = block('context_menu');
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 's', 'p', 'u', 'i'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logEvent('shortcut');
      }
      if (['F12'].includes(e.key)) {
        e.preventDefault();
        logEvent('shortcut');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, logEvent, violationLimit]);

  useEffect(() => {
    if (violations >= violationLimit && !limitFiredRef.current) {
      limitFiredRef.current = true;
      toast.error('Too many violations detected. Your exam is being submitted.');
      onViolationLimit?.();
    }
  }, [violations, violationLimit, onViolationLimit]);

  return {
    enabled,
    videoRef,
    cameraActive,
    cameraError,
    granted,
    requestCamera,
    stopCamera,
    captureSnapshot,
    events,
    violations,
    violationLimit,
  };
}
