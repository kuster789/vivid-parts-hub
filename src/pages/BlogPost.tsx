import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, BookOpen, X, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";

const ImageLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s * 1.3, MAX_SCALE));
      if (e.key === "-") setScale((s) => Math.max(s / 1.3, MIN_SCALE));
      if (e.key === "0") { setScale(1); setPosition({ x: 0, y: 0 }); }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, MIN_SCALE), MAX_SCALE));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  const reset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-white/60 truncate max-w-[50%]">{alt}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.max(s / 1.3, MIN_SCALE))} className="rounded-lg p-2 text-white/70 hover:bg-white/10 transition-colors" title="Diminuir zoom (-)">
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="min-w-[4rem] text-center text-xs font-mono text-white/60">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(s * 1.3, MAX_SCALE))} className="rounded-lg p-2 text-white/70 hover:bg-white/10 transition-colors" title="Aumentar zoom (+)">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={reset} className="rounded-lg p-2 text-white/70 hover:bg-white/10 transition-colors" title="Resetar (0)">
            <RotateCcw className="h-5 w-5" />
          </button>
          <div className="mx-2 h-5 w-px bg-white/20" />
          <button onClick={onClose} className="rounded-lg p-2 text-white/70 hover:bg-white/10 transition-colors" title="Fechar (ESC)">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
        onClick={(e) => {
          if (scale <= 1) { e.stopPropagation(); setScale(2); }
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[95vw] max-h-[85vh] object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.2s ease-out",
          }}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Bottom hint */}
      <div className="flex justify-center py-2" onClick={(e) => e.stopPropagation()}>
        <p className="rounded-md bg-white/10 px-4 py-1.5 text-[10px] text-white/50 backdrop-blur">
          Scroll para zoom · Arraste para mover · Clique para ampliar · ESC para fechar
        </p>
      </div>
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: post?.title ?? undefined,
    description: post?.excerpt ?? undefined,
    image: post?.cover_image ?? undefined,
    url: post ? `/blog/${post.slug}` : undefined,
    type: "article",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      setPost(data);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="container flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!post) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center">
        <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Artigo não encontrado.</p>
        <Link to="/blog" className="text-sm text-primary hover:underline">Voltar ao blog</Link>
      </div>
    );
  }

  return (
    <main className="py-8">
      <div className="container max-w-3xl">
        <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao blog
        </Link>

        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} className="mb-6 h-64 w-full rounded-lg object-cover md:h-80" loading="lazy" />
        )}

        <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(post.created_at).toLocaleDateString("pt-BR")}
          <span>·</span>
          <span>{post.author_name}</span>
        </div>

        <h1 className="mb-4 font-display text-2xl font-bold uppercase tracking-wide text-foreground md:text-3xl">
          {post.title}
        </h1>

        <ShareButtons
          title={post.title}
          description={post.excerpt || post.title}
          url={`https://www.motopecasagrale.com.br/blog/${post.slug}`}
        />


        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-foreground prose-h2:text-xl prose-h3:text-lg prose-strong:text-foreground prose-a:text-primary prose-table:text-xs prose-th:text-foreground prose-td:text-muted-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => (
                <figure className="group my-6 cursor-pointer" onClick={() => src && setLightbox({ src, alt: alt || "" })}>
                  <div className="relative overflow-hidden rounded-lg border border-border shadow-md">
                    <img
                      src={src}
                      alt={alt}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <Maximize2 className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-lg" />
                    </div>
                  </div>
                  {alt && (
                    <figcaption className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] italic text-muted-foreground/70">
                      <ZoomIn className="h-3 w-3" /> {alt} — clique para ampliar
                    </figcaption>
                  )}
                </figure>
              ),
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-secondary px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  {children}
                </td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-4 rounded-r-lg border-l-4 border-primary bg-primary/5 px-4 py-3 text-xs italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </div>

      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}
    </main>
  );
};

export default BlogPost;
