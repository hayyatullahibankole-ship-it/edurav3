import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerAppServiceWorker } from "./lib/registerAppServiceWorker";
import { isSignupInProgress } from "./lib/signupFlow";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && (isInIframe || isPreviewHost)) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      return Promise.all(registrations.map((registration) => registration.unregister().catch(() => undefined)));
    })
    .catch(() => undefined);
}

void registerAppServiceWorker();

// Recover from stale lazy-chunk references after a new deploy:
// reload once so the browser fetches the fresh asset manifest.
const RELOAD_FLAG = "edura:chunk-reload";
const recoverFromStaleChunk = () => {
  if (isSignupInProgress()) return;
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverFromStaleChunk();
});

window.addEventListener("unhandledrejection", (event) => {
  const message = String((event.reason as Error)?.message || event.reason || "");
  if (message.includes("Failed to fetch dynamically imported module") ||
      message.includes("error loading dynamically imported module")) {
    recoverFromStaleChunk();
  }
});

window.addEventListener("load", () => {
  // Clear the guard once the app boots successfully.
  setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 5000);
});

const root = document.getElementById("root");
if (!root) throw new Error("App root element not found");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
