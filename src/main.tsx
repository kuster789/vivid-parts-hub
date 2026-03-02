import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const host = window.location.hostname;
  const isPreviewHost = host.includes("lovable.app") || host.includes("lovableproject.com");

  if (isPreviewHost) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ("caches" in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
