import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";

const Blog = () => {
  useSEO({
    title: "Blog — Dicas e Tutoriais de Motos",
    description: "Artigos técnicos, dicas de manutenção e tutoriais sobre Agrale, Yamaha, Cagiva e KTM. Aprenda a cuidar melhor da sua moto.",
    url: "/blog",
    type: "website",
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main className="py-8">
      <div className="container max-w-4xl">
        <h1 className="section-title mb-2">Blog</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Dicas, novidades e conteúdo técnico sobre peças e motocicletas.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Em breve teremos novidades!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="card-industrial group overflow-hidden transition-all hover:border-primary/40"
              >
                {post.cover_image && (
                  <img src={post.cover_image} alt={post.title} className="h-48 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString("pt-BR")}
                    <span>·</span>
                    <span>{post.author_name}</span>
                  </div>
                  <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mb-3 line-clamp-3 text-xs text-muted-foreground">{post.excerpt}</p>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    Ler mais <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Blog;
