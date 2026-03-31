import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, BookOpen, MessageCircle, Users, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const whatsappGroups = [
  {
    name: "2 Stroke Vendas e Compras",
    description: "Grupo dedicado à compra e venda de peças e motos 2 tempos. Encontre peças raras, negocie diretamente com entusiastas e restauradores.",
    url: "https://chat.whatsapp.com/Bju6lzjZuicLsTknAn6KIq",
  },
  {
    name: "Agrale Cagiva BR",
    description: "A maior comunidade brasileira de Agrale e Cagiva. Discussões técnicas, dicas de manutenção, peças originais e muito mais.",
    url: "https://chat.whatsapp.com/IItzt0PlS3xHwr12txFjHB",
  },
  {
    name: "Cabo Enrolado 2T e 4T",
    description: "Grupo para amantes de motos 2 tempos e 4 tempos. Troca de informações técnicas, encontros e negociações entre membros.",
    url: "https://chat.whatsapp.com/FFYJcnZVmSpJBUXb1iwkHl",
  },
];

const Blog = () => {
  useSEO({
    title: "Blog & Comunidade — Peças Agrale, Cagiva e Motos 2 Tempos",
    description: "Artigos técnicos, dicas de manutenção e a maior comunidade de Agrale, Cagiva e motos 2 tempos do Brasil. Peças antigas, compra, venda e suporte técnico.",
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
      <div className="container max-w-5xl">
        {/* ── Blog Section ── */}
        <section>
          <h1 className="section-title mb-2">Blog</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Dicas, novidades e conteúdo técnico sobre peças para Agrale, Cagiva, motos 2 tempos e peças antigas de motocicletas.
          </p>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-industrial overflow-hidden animate-pulse">
                  <div className="h-48 w-full bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-5/6 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Em breve teremos novidades!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="card-industrial group overflow-hidden transition-all hover:border-primary/40"
                >
                  {post.cover_image && (
                    <img src={post.cover_image} alt={post.title} className="h-48 w-full object-cover" loading="lazy" />
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
        </section>

        {/* ── Community / WhatsApp Groups Section ── */}
        <section className="mt-16 border-t border-border pt-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(142,70%,45%)]/10 px-4 py-1.5 text-xs font-semibold text-[hsl(142,70%,35%)] mb-4">
              <Users className="h-3.5 w-3.5" />
              COMUNIDADE
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground mb-3">
              Participe da maior comunidade Agrale e 2T do Brasil
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Entre nos grupos exclusivos de compra, venda e troca de informações técnicas sobre peças Agrale, Cagiva e motos 2 tempos.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whatsappGroups.map((group) => (
              <Card
                key={group.name}
                className="group relative overflow-hidden border-border/60 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(142,70%,45%)]/5 hover:border-[hsl(142,70%,45%)]/30"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(142,70%,45%)]/10">
                      <MessageCircle className="h-5 w-5 text-[hsl(142,70%,45%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-[hsl(142,70%,40%)] transition-colors">
                        {group.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-5 flex-1">
                    {group.description}
                  </p>

                  <a
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(142,70%,45%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[hsl(142,70%,38%)] hover:shadow-md active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Entrar no Grupo
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
            Ao entrar, você concorda com as regras de cada grupo. Respeite os demais membros.
          </p>
        </section>
      </div>
    </main>
  );
};

export default Blog;
