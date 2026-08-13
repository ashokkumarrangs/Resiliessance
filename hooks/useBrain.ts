import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format, addDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CardType =
  | "fleeting"
  | "idea"
  | "book_note"
  | "quote"
  | "article"
  | "insight"
  | "concept";

export interface BrainCard {
  id: string;
  title: string;
  type: CardType;
  body: string | null;
  source: string | null;
  tags: string[];
  icon: string;
  next_review_date: string;
  review_interval_days: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface BrainLink {
  id: string;
  from_card_id: string;
  to_card_id: string;
  created_at: string;
}

export type ReviewRating = "hard" | "medium" | "easy";

// ─── Card type config (label, icon, accent color) ──────────────────────────
export const CARD_TYPE_CONFIG: Record<
  CardType,
  { label: string; icon: string; accentColor: string; badgeClass: string }
> = {
  idea:      { label: "Idea",      icon: "💡", accentColor: "#2b5c8f", badgeClass: "bg-primary/10 text-primary" },
  book_note: { label: "Book Note", icon: "📚", accentColor: "#10b981", badgeClass: "bg-emerald-500/15 text-emerald-600" },
  quote:     { label: "Quote",     icon: "💬", accentColor: "#f59e0b", badgeClass: "bg-amber-500/15 text-amber-600" },
  article:   { label: "Article",   icon: "🔗", accentColor: "#3b82f6", badgeClass: "bg-blue-500/15 text-blue-600" },
  insight:   { label: "Insight",   icon: "⚡", accentColor: "#8b5cf6", badgeClass: "bg-violet-500/15 text-violet-600" },
  concept:   { label: "Concept",   icon: "🧩", accentColor: "#ec4899", badgeClass: "bg-pink-500/15 text-pink-600" },
  fleeting:  { label: "Fleeting",  icon: "✏️", accentColor: "#5a738c", badgeClass: "bg-muted/60 text-muted-foreground" },
};

// ─── Spaced repetition interval calc ─────────────────────────────────────────
function calcNextReview(currentInterval: number, rating: ReviewRating): { intervalDays: number; nextDate: string } {
  let intervalDays: number;
  if (rating === "hard")   intervalDays = Math.max(1, Math.floor(currentInterval * 0.5));
  else if (rating === "easy") intervalDays = Math.min(60, currentInterval * 2);
  else intervalDays = currentInterval; // medium — keep same interval, just reschedule

  const nextDate = format(addDays(new Date(), intervalDays), "yyyy-MM-dd");
  return { intervalDays, nextDate };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBrain() {
  const [cards, setCards] = useState<BrainCard[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brain_cards")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setCards(data ?? []);
    setLoading(false);
    return data ?? [];
  }, []);

  // ── Derived queries ────────────────────────────────────────────────────────
  const getInboxCards = () => cards.filter((c) => c.type === "fleeting");

  const getReviewDueCards = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return cards.filter(
      (c) => c.type !== "fleeting" && c.next_review_date <= today
    );
  };

  const getNonFleetingCards = () => cards.filter((c) => c.type !== "fleeting");

  // ── Create ────────────────────────────────────────────────────────────────
  const createCard = async (
    data: Partial<Omit<BrainCard, "id" | "created_at" | "updated_at">>
  ) => {
    const { error } = await supabase.from("brain_cards").insert({
      title: data.title ?? "Untitled",
      type: data.type ?? "idea",
      body: data.body ?? null,
      source: data.source ?? null,
      tags: data.tags ?? [],
      icon: data.icon ?? CARD_TYPE_CONFIG[data.type ?? "idea"].icon,
      next_review_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      review_interval_days: 7,
      review_count: 0,
    });
    return error;
  };

  // ── Create fleeting (quick capture) ───────────────────────────────────────
  const createFleetingNote = async (body: string) => {
    const preview = body.slice(0, 60);
    const { error } = await supabase.from("brain_cards").insert({
      title: preview || "Quick Note",
      type: "fleeting",
      body,
      source: null,
      tags: [],
      icon: "✏️",
      next_review_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      review_interval_days: 7,
      review_count: 0,
    });
    return error;
  };

  // ── Promote fleeting → typed card ─────────────────────────────────────────
  const promoteCard = async (
    id: string,
    updates: Partial<Omit<BrainCard, "id" | "created_at">>
  ) => {
    const { error } = await supabase
      .from("brain_cards")
      .update({
        ...updates,
        icon: updates.icon ?? CARD_TYPE_CONFIG[updates.type ?? "idea"].icon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    return error;
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const updateCard = async (
    id: string,
    data: Partial<Omit<BrainCard, "id" | "created_at">>
  ) => {
    const { error } = await supabase
      .from("brain_cards")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    return error;
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteCard = async (id: string) => {
    const { error } = await supabase.from("brain_cards").delete().eq("id", id);
    return error;
  };

  // ── Rate (spaced repetition) ───────────────────────────────────────────────
  const rateCard = async (card: BrainCard, rating: ReviewRating) => {
    const { intervalDays, nextDate } = calcNextReview(card.review_interval_days, rating);
    const { error } = await supabase
      .from("brain_cards")
      .update({
        review_interval_days: intervalDays,
        next_review_date: nextDate,
        review_count: card.review_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id);
    return error;
  };

  // ── Links ─────────────────────────────────────────────────────────────────
  const getLinks = async (cardId: string) => {
    const { data } = await supabase
      .from("brain_links")
      .select("*")
      .or(`from_card_id.eq.${cardId},to_card_id.eq.${cardId}`);
    return data ?? [];
  };

  const addLink = async (fromId: string, toId: string) => {
    const { error } = await supabase
      .from("brain_links")
      .insert({ from_card_id: fromId, to_card_id: toId });
    return error;
  };

  return {
    cards,
    loading,
    fetchCards,
    getInboxCards,
    getReviewDueCards,
    getNonFleetingCards,
    createCard,
    createFleetingNote,
    promoteCard,
    updateCard,
    deleteCard,
    rateCard,
    getLinks,
    addLink,
  };
}
