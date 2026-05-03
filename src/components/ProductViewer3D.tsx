import { useEffect, useRef, useState } from "react";
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

function getExtension(url: string): string {
  return url.split("?")[0].split(".").pop()?.toLowerCase() || "";
}

const ProductViewer3D = ({ modelUrl, poster, selectedColor }: ProductViewer3DProps) => {
  const ext = modelUrl ? getExtension(modelUrl) : "";
  const useThreeViewer = THREE_EXTENSIONS.includes(ext);

  // If it's a Three.js format, lazy-load ThreeViewer
  if (useThreeViewer && modelUrl) {
    return <ThreeViewerWrapper modelUrl={modelUrl} selectedColor={selectedColor} />;
  }

  // Otherwise use model-viewer (GLB/GLTF or fallback)
  return <ModelViewerWrapper modelUrl={modelUrl} poster={poster} selectedColor={selectedColor} />;
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
      
      // Initial color application after load
      if (selectedColor) {
        applyColorToModel(selectedColor);
      }
    };
    
    const onError = () => {
      setLoading(false);
      setError("Erro ao carregar modelo 3D");
    };

    const onProgress = (event: any) => {
      const p = Math.round(event.detail.totalProgress * 100);
      setProgress(p);
      if (p >= 100) {
        // We don't set loading false here because 'load' event is more reliable for completion
      }
    };

    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("progress", onProgress);

    const timeout = setTimeout(() => {
      if (loading && progress < 10) {
        setLoading(false);
        setError("Tempo limite de carregamento excedido");
      }
    }, 30000);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("progress", onProgress);
      clearTimeout(timeout);
    };
  }, [modelUrl]);

  // Handle color updates
  useEffect(() => {
    if (!loading && selectedColor) {
      applyColorToModel(selectedColor);
    }
  }, [selectedColor, loading]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
      1
    ] : [1, 1, 1, 1];
  };

  const applyColorToModel = (colorName: string) => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.model) return;

    const color = colorOptions.find(c => c.name === colorName);
    if (!color) return;

    const rgba = hexToRgb(color.hex);
    
    // Try to find materials that should be colored
    // Typically we want to color the main body parts
    viewer.model.materials.forEach((material: any) => {
      // Logic to filter which materials to color (e.g. by name)
      // For now, let's color all materials that aren't obviously glass/metal/tires if possible
      // Or just color everything for simplicity if it's a single part model
      if (material.pbrMetallicRoughness) {
        material.pbrMetallicRoughness.setBaseColorFactor(rgba);
      }
    });
  };

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
    const orbit = viewer.getCameraOrbit();
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
          <button
            onClick={() => handleZoom('in')}
            title="Aumentar zoom"
            className="flex h-8 w-8 items-center justify-center border-b border-border/50 transition-colors hover:bg-background"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            title="Diminuir zoom"
            className="flex h-8 w-8 items-center justify-center border-b border-border/50 transition-colors hover:bg-background"
          >
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={resetCamera}
            title="Resetar câmera"
            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-background"
          >
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
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
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
            <span className="text-[10px] font-bold text-primary">
              MODELO DEMONSTRATIVO — MODELO REAL EM BREVE
            </span>
          </div>
        )}
        <div className="rounded-md bg-background/80 px-3 py-1.5 backdrop-blur shadow-sm border border-border/40">
          <span className="text-[10px] font-medium text-muted-foreground">
            ARRASte para girar · ZOOM COM O MOUSE · CONTROLES LATERAIS
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductViewer3D;
