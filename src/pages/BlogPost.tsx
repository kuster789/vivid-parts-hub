import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";

const BlogPost = () => {
  const { slug } = useParams();
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

        <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-wide text-foreground md:text-3xl">
          {post.title}
        </h1>

        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-foreground prose-h2:text-xl prose-h3:text-lg prose-strong:text-foreground prose-a:text-primary prose-table:text-xs prose-th:text-foreground prose-td:text-muted-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => (
                <figure className="my-6">
                  <img
                    src={src}
                    alt={alt}
                    className="w-full rounded-lg border border-border object-cover shadow-md"
                    loading="lazy"
                  />
                  {alt && (
                    <figcaption className="mt-2 text-center text-[11px] italic text-muted-foreground/70">
                      {alt}
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
    </main>
  );
};

export default BlogPost;
