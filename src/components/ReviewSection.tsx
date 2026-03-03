import { useState, useEffect } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface ReviewSectionProps {
  productId: string;
}

const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, [productId]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    await supabase.from("reviews").upsert({
      user_id: user.id,
      product_id: productId,
      rating,
      comment,
      user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anônimo",
    }, { onConflict: "user_id,product_id" });
    setRating(0);
    setComment("");
    setSubmitting(false);
    loadReviews();
  };

  const Stars = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= (interactive ? hoverRating || value : value)
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          } ${interactive ? "cursor-pointer transition-colors" : ""}`}
          onClick={interactive ? () => setRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
          Avaliações
        </h2>
        <div className="flex items-center gap-2">
          <Stars value={Math.round(Number(avgRating))} />
          <span className="font-display text-sm font-bold text-primary">{avgRating}</span>
          <span className="text-xs text-muted-foreground">({reviews.length})</span>
        </div>
      </div>

      {/* Add review */}
      {user && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sua avaliação</p>
          <Stars value={rating} interactive />
          <textarea
            value={comment}
            onChange={(e) => {
              if (e.target.value.length <= 500) setComment(e.target.value);
            }}
            maxLength={500}
            placeholder="Deixe um comentário (opcional, máx. 500 caracteres)..."
            className="mt-3 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            rows={2}
          />
          <p className="mt-1 text-right text-[10px] text-muted-foreground">{comment.length}/500</p>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="btn-primary-glow mt-2 flex items-center gap-2 rounded-md px-4 py-2 text-xs disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma avaliação ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-display text-[10px] font-bold text-primary">
                      {(r.user_name || "A")[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{r.user_name || "Anônimo"}</span>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <p className="mt-2 text-[10px] text-muted-foreground/60">
                {new Date(r.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
