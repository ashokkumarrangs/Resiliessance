"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { BRAIN_TABS } from "@/lib/navigation";
import { useBrain, CARD_TYPE_CONFIG, BrainCard, ReviewRating, CardType } from "@/hooks/useBrain";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Loader2, Eye, ExternalLink, Link as LinkIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ReviewPage() {
  const {
    fetchCards,
    getReviewDueCards,
    rateCard,
    getNonFleetingCards,
    loading
  } = useBrain();

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showBody, setShowBody] = useState(false);
  const [rating, setRating] = useState<ReviewRating | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Link states
  const [activeCardLinks, setActiveCardLinks] = useState<{ id: string; title: string; type: CardType; icon: string }[]>([]);

  const allCards = getNonFleetingCards();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const dueCards = getReviewDueCards();
  const currentCard: BrainCard | undefined = dueCards[activeCardIndex];

  const loadCardLinks = useCallback(async (cardId: string) => {
    try {
      const { data: linksData, error: linksError } = await supabase
        .from("brain_links")
        .select("*")
        .or(`from_card_id.eq.${cardId},to_card_id.eq.${cardId}`);

      if (linksError) throw linksError;
      if (!linksData || linksData.length === 0) {
        setActiveCardLinks([]);
        return;
      }

      const linkedIds = linksData.map((l) => (l.from_card_id === cardId ? l.to_card_id : l.from_card_id));
      
      const { data: cardsData, error: cardsError } = await supabase
        .from("brain_cards")
        .select("id, title, type, icon")
        .in("id", linkedIds);

      if (cardsError) throw cardsError;

      const matchedLinks = (cardsData || []).map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type as CardType,
        icon: c.icon || "💡"
      }));

      setActiveCardLinks(matchedLinks);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (currentCard) {
      loadCardLinks(currentCard.id);
    } else {
      setActiveCardLinks([]);
    }
  }, [currentCard, loadCardLinks]);

  const handleRate = async (rateValue: ReviewRating) => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    setRating(rateValue);

    const error = await rateCard(currentCard, rateValue);
    setSubmitting(false);
    setRating(null);

    if (error) {
      toast.error("Failed to submit rating");
    } else {
      toast.success("Card scheduled! 🃏");
      setShowBody(false);
      if (activeCardIndex >= dueCards.length - 1) {
        setActiveCardIndex(0);
      }
      fetchCards();
    }
  };

  const handleReveal = () => {
    setShowBody(true);
  };

  return (
    <PageWrapper title="Second Brain" sectionTabs={BRAIN_TABS}>
      <div className="space-y-5 page-stagger-container">
        {/* Metric Header */}
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-black uppercase tracking-[4px] text-muted-foreground">
            Spaced Repetition Review Queue
          </div>
          {dueCards.length > 0 && (
            <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {dueCards.length} due
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : dueCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-card border border-border/40 rounded-3xl p-6">
            <span className="text-5xl">🎉</span>
            <div>
              <div className="text-md font-black text-foreground">You are all caught up!</div>
              <div className="text-[11px] text-muted-foreground mt-1 max-w-[240px] mx-auto">
                No cards due for review today. Spaced repetition keeps your memory sharp passively.
              </div>
            </div>
          </div>
        ) : (
          currentCard && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-black text-muted-foreground uppercase">
                  <span>Card {activeCardIndex + 1} of {dueCards.length}</span>
                  <span>{Math.round(((activeCardIndex + 1) / dueCards.length) * 100)}%</span>
                </div>
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${((activeCardIndex + 1) / dueCards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Main Flashcard display */}
              <div
                className="bg-card border border-border/40 rounded-3xl p-6 space-y-4 min-h-[220px] flex flex-col justify-between relative overflow-hidden transition-all shadow-md"
                style={{
                  borderTop: `6px solid ${
                    (CARD_TYPE_CONFIG[currentCard.type] || CARD_TYPE_CONFIG.idea).accentColor
                  }`
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        (CARD_TYPE_CONFIG[currentCard.type] || CARD_TYPE_CONFIG.idea).badgeClass
                      }`}
                    >
                      {currentCard.icon} {(CARD_TYPE_CONFIG[currentCard.type] || CARD_TYPE_CONFIG.idea).label}
                    </span>
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase">
                      Reviews: {currentCard.review_count || 0}
                    </span>
                  </div>

                  <h2 className="text-[18px] font-black text-foreground leading-snug">
                    {currentCard.title}
                  </h2>

                  {currentCard.source && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{currentCard.source}</span>
                    </div>
                  )}

                  {/* Body details hidden until reveal */}
                  {showBody ? (
                    <div className="pt-3 border-t border-border/20 text-[13px] text-foreground leading-relaxed font-medium break-words space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Markdown rendering! */}
                      <MarkdownRenderer content={currentCard.body || ""} />

                      {/* Display bidirectional links connected to this review card */}
                      {activeCardLinks.length > 0 && (
                        <div className="border-t border-border/10 pt-3 space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> Linked Cards
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {activeCardLinks.map((link) => (
                              <span
                                key={link.id}
                                className="bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                              >
                                {link.icon} {link.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {currentCard.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {currentCard.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 flex items-center justify-center border-t border-border/10 border-dashed">
                      <p className="text-[11px] text-muted-foreground/60 italic font-semibold">Click Show Details to reveal content</p>
                    </div>
                  )}
                </div>

                {!showBody && (
                  <button
                    onClick={handleReveal}
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                    className="w-full font-black text-[13px] py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-4"
                  >
                    <Eye size={15} /> Show Details
                  </button>
                )}
              </div>

              {/* Rating Actions */}
              {showBody && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-[10px] font-black uppercase text-muted-foreground text-center tracking-wider font-semibold">
                    How well did you remember this?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRate("hard")}
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-black text-[12px] uppercase tracking-wider active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {submitting && rating === "hard" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "🔴 Hard"
                      )}
                    </button>
                    <button
                      onClick={() => handleRate("medium")}
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl font-black text-[12px] uppercase tracking-wider active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {submitting && rating === "medium" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "🟡 Medium"
                      )}
                    </button>
                    <button
                      onClick={() => handleRate("easy")}
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl font-black text-[12px] uppercase tracking-wider active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {submitting && rating === "easy" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "🟢 Easy"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </PageWrapper>
  );
}
