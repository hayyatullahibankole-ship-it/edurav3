import { registerSW } from "virtual:pwa-register";
import { isSignupInProgress } from "@/lib/signupFlow";

const isPreviewOrDevelopment = () => {
  const hostname = window.location.hostname;
  const isIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  return (
    !import.meta.env.PROD ||
    isIframe ||
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(window.location.search).get("sw") === "off"
  );
};

const removeAppWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter(({ active, waiting, installing }) =>
        [active, waiting, installing].some((worker) =>
          worker?.scriptURL.endsWith("/sw.js") || worker?.scriptURL.endsWith("/pwabuilder-sw.js"),
        ),
      )
      .map((registration) => registration.unregister()),
  );
};

export const registerAppServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  if (isPreviewOrDevelopment()) {
    await removeAppWorkers().catch(() => undefined);
    return;
  }

  registerSW({
    immediate: true,
    onNeedRefresh() {
      if (isSignupInProgress()) return;
      window.location.reload();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (document.visibilityState === "visible") registration.update().catch(() => undefined);
      };
      document.addEventListener("visibilitychange", check);
      window.addEventListener("focus", check);
      setInterval(check, 60 * 60 * 1000);
    },
  });
};
