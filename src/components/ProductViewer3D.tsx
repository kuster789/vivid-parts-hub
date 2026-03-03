import { useEffect, useRef, useState } from "react";
import { RotateCcw, Loader2, AlertCircle, Maximize2 } from "lucide-react";
import "@google/model-viewer";

interface ProductViewer3DProps {
  modelUrl?: string;
  poster?: string;
}

const GLB_EXTENSIONS = ["glb", "gltf"];
const THREE_EXTENSIONS = ["stl", "obj", "3mf", "step", "stp"];

function getExtension(url: string): string {
  return url.split("?")[0].split(".").pop()?.toLowerCase() || "";
}

const ProductViewer3D = ({ modelUrl, poster }: ProductViewer3DProps) => {
  const ext = modelUrl ? getExtension(modelUrl) : "";
  const useThreeViewer = THREE_EXTENSIONS.includes(ext);

  // If it's a Three.js format, lazy-load ThreeViewer
  if (useThreeViewer && modelUrl) {
    return <ThreeViewerWrapper modelUrl={modelUrl} />;
  }

  // Otherwise use model-viewer (GLB/GLTF or fallback)
  return <ModelViewerWrapper modelUrl={modelUrl} poster={poster} />;
};

// ─── Lazy ThreeViewer wrapper ───
import { lazy, Suspense } from "react";
const LazyThreeViewer = lazy(() => import("./ThreeViewer"));

function ThreeViewerWrapper({ modelUrl }: { modelUrl: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-border bg-secondary md:h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LazyThreeViewer fileUrl={modelUrl} fileName={modelUrl} />
    </Suspense>
  );
}

// ─── Model Viewer (GLB/GLTF) ───
function ModelViewerWrapper({
  modelUrl,
  poster,
}: {
  modelUrl?: string;
  poster?: string;
}) {
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onLoad = () => { setLoading(false); setError(null); };
    const onError = () => { setLoading(false); setError("Erro ao carregar modelo 3D"); };

    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);

    const timeout = setTimeout(() => { if (loading) setLoading(false); }, 15000);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      clearTimeout(timeout);
    };
  }, [modelUrl]);

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

  const FALLBACK_MODEL = "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb";
  const effectiveUrl = modelUrl || FALLBACK_MODEL;
  const isFallback = !modelUrl;

  return (
    <div
      ref={containerRef}
      className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border bg-secondary md:h-[500px]"
    >
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 backdrop-blur">
        <RotateCcw className="h-3.5 w-3.5 text-primary" />
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Visualização 3D
        </span>
      </div>

      <button
        onClick={toggleFullscreen}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-colors hover:bg-background"
      >
        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-secondary/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Carregando modelo 3D...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-secondary/80">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <span className="text-xs">{error}</span>
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
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
      />

      <div className="absolute bottom-3 left-3 right-3 flex flex-col items-center gap-1">
        {isFallback && (
          <div className="rounded-md bg-primary/10 px-3 py-1 backdrop-blur">
            <span className="text-[10px] font-medium text-primary">
              Modelo demonstrativo — modelo real em breve
            </span>
          </div>
        )}
        <div className="rounded-md bg-background/80 px-3 py-1.5 backdrop-blur">
          <span className="text-[10px] text-muted-foreground">
            Arraste para girar · Scroll para zoom · Pinça para aproximar
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductViewer3D;
