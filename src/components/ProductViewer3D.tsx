import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, Loader2, AlertCircle, Maximize2, Plus, Minus, RefreshCw } from "lucide-react";
import "@google/model-viewer";
import { colorOptions } from "./ColorSelector";

interface ProductViewer3DProps {
  modelUrl?: string;
  poster?: string;
  selectedColor?: string;
}

const GLB_EXTENSIONS = ["glb", "gltf"];
const THREE_EXTENSIONS = ["stl", "obj", "3mf", "step", "stp"];

// ─── Browser Cache Helper (IndexedDB) ───
const CACHE_NAME = "model-3d-cache";
const DB_NAME = "MotoPecas3D";
const DB_VERSION = 1;
const STORE_NAME = "models";

async function getDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedModel(url: string): Promise<string | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result = await new Promise<any>((resolve) => {
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result);
    });
    if (result) {
      return URL.createObjectURL(result);
    }
    return null;
  } catch (e) {
    console.warn("IndexedDB cache error:", e);
    return null;
  }
}

async function cacheModel(url: string, blob: Blob) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, url);
  } catch (e) {
    console.warn("Failed to cache model:", e);
  }
}

function getExtension(url: string): string {
  return url.split("?")[0].split(".").pop()?.toLowerCase() || "";
}

const ProductViewer3D = ({ modelUrl, poster, selectedColor }: ProductViewer3DProps) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const ext = modelUrl ? getExtension(modelUrl) : "";
  const useThreeViewer = THREE_EXTENSIONS.includes(ext);

  useEffect(() => {
    if (!modelUrl) return;
    
    let isMounted = true;
    async function checkCache() {
      // Don't cache demo models or tiny things
      if (modelUrl.includes('modelviewer.dev')) {
        setCachedUrl(modelUrl);
        return;
      }

      const cached = await getCachedModel(modelUrl);
      if (cached && isMounted) {
        setCachedUrl(cached);
      } else if (isMounted) {
        // Not in cache, use original and cache it after download
        setCachedUrl(modelUrl);
        fetch(modelUrl).then(r => r.blob()).then(blob => cacheModel(modelUrl, blob));
      }
    }
    checkCache();
    return () => { isMounted = false; };
  }, [modelUrl]);

  const effectiveUrl = cachedUrl || modelUrl;

  // If it's a Three.js format, lazy-load ThreeViewer
  if (useThreeViewer && effectiveUrl) {
    return <ThreeViewerWrapper modelUrl={effectiveUrl} selectedColor={selectedColor} />;
  }

  // Otherwise use model-viewer (GLB/GLTF or fallback)
  return <ModelViewerWrapper modelUrl={effectiveUrl} poster={poster} selectedColor={selectedColor} />;
};

// ─── Lazy ThreeViewer wrapper ───
import { lazy, Suspense } from "react";
const LazyThreeViewer = lazy(() => import("./ThreeViewer"));

function ThreeViewerWrapper({ modelUrl, selectedColor }: { modelUrl: string, selectedColor?: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-border bg-secondary md:h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LazyThreeViewer fileUrl={modelUrl} fileName={modelUrl} selectedColor={selectedColor} />
    </Suspense>
  );
}

// ─── Model Viewer (GLB/GLTF) ───
function ModelViewerWrapper({
  modelUrl,
  poster,
  selectedColor,
}: {
  modelUrl?: string;
  poster?: string;
  selectedColor?: string;
}) {
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onLoad = () => {
      setLoading(false);
      setError(null);
      setProgress(100);
      if (selectedColor) applyColorToModel(selectedColor);
    };
    
    const onError = () => {
      setLoading(false);
      setError("Erro ao carregar modelo 3D");
    };

    const onProgress = (event: any) => {
      const p = Math.round(event.detail.totalProgress * 100);
      setProgress(p);
    };

    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("progress", onProgress);

    const timeout = setTimeout(() => {
      if (loading && progress < 5) {
        setLoading(false);
        setError("Tempo limite de carregamento excedido");
      }
    }, 45000);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("progress", onProgress);
      clearTimeout(timeout);
    };
  }, [modelUrl]);

  // Empty for now, will use useCallback/useEffect combo below

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
      1
    ] : [1, 1, 1, 1];
  };

  const applyColorToModel = useCallback((colorName: string) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    
    const apply = () => {
      if (!viewer.model) return;
      const color = colorOptions.find(c => c.name === colorName);
      if (!color) return;
      const rgba = hexToRgb(color.hex);
      viewer.model.materials.forEach((material: any) => {
        if (material.pbrMetallicRoughness) {
          material.pbrMetallicRoughness.setBaseColorFactor(rgba);
        }
      });
    };

    if (viewer.model) apply();
    else viewer.addEventListener("load", apply, { once: true });
  }, []);

  useEffect(() => {
    if (selectedColor) {
      applyColorToModel(selectedColor);
    }
  }, [selectedColor, applyColorToModel]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleZoom = (type: 'in' | 'out') => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const zoomFactor = type === 'in' ? 0.8 : 1.2;
    viewer.zoom(zoomFactor);
  };

  const resetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = "0deg 75deg 105%";
    viewer.cameraTarget = "auto auto auto";
  };

  const FALLBACK_MODEL = "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb";
  const effectiveUrl = modelUrl || FALLBACK_MODEL;
  const isFallback = !modelUrl;

  return (
    <div
      ref={containerRef}
      className={`relative h-[400px] w-full overflow-hidden rounded-lg border border-border bg-secondary md:h-[500px] transition-all duration-300 ${isFullscreen ? 'h-screen w-screen rounded-none border-none' : ''}`}
    >
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 backdrop-blur shadow-sm">
        <RotateCcw className="h-3.5 w-3.5 text-primary" />
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Visualização 3D
        </span>
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-all hover:bg-background shadow-sm hover:scale-105"
        >
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        
        <div className="flex flex-col rounded-md bg-background/80 backdrop-blur shadow-sm overflow-hidden">
          <button onClick={() => handleZoom('in')} title="Aumentar zoom" className="flex h-8 w-8 items-center justify-center border-b border-border/50 transition-colors hover:bg-background">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => handleZoom('out')} title="Diminuir zoom" className="flex h-8 w-8 items-center justify-center border-b border-border/50 transition-colors hover:bg-background">
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={resetCamera} title="Resetar câmera" className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-background">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-secondary/80 backdrop-blur-sm">
          <div className="flex w-full max-w-[200px] flex-col items-center gap-4 px-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="absolute text-[10px] font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {progress < 100 ? "Carregando texturas..." : "Renderizando..."}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-secondary/80">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        </div>
      )}

      <model-viewer
        ref={viewerRef}
        src={effectiveUrl}
        alt="Modelo 3D do produto"
        poster={poster}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        exposure="1"
        shadow-softness="0.5"
        environment-image="neutral"
        loading="eager"
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
      />

      <div className="absolute bottom-3 left-3 right-3 flex flex-col items-center gap-1">
        {isFallback && (
          <div className="rounded-md bg-primary/10 px-3 py-1 backdrop-blur border border-primary/20">
            <span className="text-[10px] font-bold text-primary">MODELO DEMONSTRATIVO — MODELO REAL EM BREVE</span>
          </div>
        )}
        <div className="rounded-md bg-background/80 px-3 py-1.5 backdrop-blur shadow-sm border border-border/40">
          <span className="text-[10px] font-medium text-muted-foreground">ARRASte para girar · ZOOM COM O MOUSE · CONTROLES LATERAIS</span>
        </div>
      </div>
    </div>
  );
}

export default ProductViewer3D;
