import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Loader2,
  AlertCircle,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string;
  title?: string;
}

const PdfViewer = ({ fileUrl, title }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setError("Falha ao carregar o PDF");
    setLoading(false);
  }, []);

  const goToPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNext = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(s * 1.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s / 1.25, 0.5));
  const resetZoom = () => setScale(1.2);

  const handleFullscreen = () => {
    const el = document.getElementById("pdf-viewer-container");
    if (el) el.requestFullscreen?.();
  };

  return (
    <div
      id="pdf-viewer-container"
      className="my-6 overflow-hidden rounded-lg border border-border bg-secondary"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur">
        <span className="truncate text-xs font-medium text-foreground">
          {title || "Documento PDF"}
        </span>

        <div className="flex items-center gap-1">
          {/* Pagination */}
          <button
            onClick={goToPrev}
            disabled={pageNumber <= 1}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[5rem] text-center text-xs text-muted-foreground">
            {pageNumber} / {numPages || "…"}
          </span>
          <button
            onClick={goToNext}
            disabled={pageNumber >= numPages}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Zoom */}
          <button
            onClick={zoomOut}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-[10px] font-mono text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={resetZoom}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <button
            onClick={handleFullscreen}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative overflow-auto bg-secondary" style={{ maxHeight: "80vh" }}>
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Carregando PDF…</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <span className="mt-2 text-sm">{error}</span>
          </div>
        )}

        <div className="flex justify-center py-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-lg"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-background/80 px-3 py-1.5 text-center">
        <span className="text-[10px] text-muted-foreground">
          Use os controles acima para navegar · Scroll para rolar · Tela cheia para melhor leitura
        </span>
      </div>
    </div>
  );
};

export default PdfViewer;
