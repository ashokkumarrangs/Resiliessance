"use client";

import React, { useEffect, useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { BRAIN_TABS } from "@/lib/navigation";
import { useBrain, CARD_TYPE_CONFIG, CardType, BrainCard } from "@/hooks/useBrain";
import { Loader2, Send, Trash2, ArrowUpCircle, X, Edit3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function InboxPage() {
  const {
    fetchCards,
    getInboxCards,
    createFleetingNote,
    promoteCard,
    deleteCard,
    loading
  } = useBrain();

  const [quickInput, setQuickInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [promotingCard, setPromotingCard] = useState<BrainCard | null>(null);

  // Form states for promotion
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<CardType>("idea");
  const [formBody, setFormBody] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formTagsString, setFormTagsString] = useState("");
  const [formIcon, setFormIcon] = useState("💡");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const fleetingCards = getInboxCards();

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setAdding(true);
    const error = await createFleetingNote(quickInput.trim());
    setAdding(false);

    if (error) {
      toast.error("Failed to save fleeting note");
    } else {
      toast.success("Fleeting note captured! ✏️");
      setQuickInput("");
      fetchCards();
    }
  };

  const handleOpenPromote = (card: BrainCard) => {
    setPromotingCard(card);
    setFormTitle("");
    setFormType("idea");
    setFormBody(card.body || "");
    setFormSource("");
    setFormTagsString("");
    setFormIcon("💡");
  };

  const handleClosePromote = () => {
    setPromotingCard(null);
  };

  const handlePromoteSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingCard) return;
    if (!formTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    const tags = formTagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const promoteData = {
      title: formTitle.trim(),
      type: formType,
      body: formBody.trim() || null,
      source: formSource.trim() || null,
      tags,
      icon: formIcon || CARD_TYPE_CONFIG[formType].icon,
    };

    const error = await promoteCard(promotingCard.id, promoteData);
    setSaving(false);

    if (error) {
      toast.error("Failed to promote card");
    } else {
      toast.success("Promoted to knowledge card! 🧠");
      handleClosePromote();
      fetchCards();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to discard this fleeting note?")) return;
    const error = await deleteCard(id);
    if (error) {
      toast.error("Failed to delete note");
    } else {
      toast.success("Fleeting note discarded");
      fetchCards();
    }
  };

  return (
    <PageWrapper title="Second Brain" sectionTabs={BRAIN_TABS}>
      <div className="space-y-5 page-stagger-container">
        {/* Quick Capture Input */}
        <form onSubmit={handleQuickSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Quick capture a fleeting thought..."
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            disabled={adding}
            className="flex-1 bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={adding || !quickInput.trim()}
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            className="p-3 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-40 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[11px] text-muted-foreground flex gap-2 leading-relaxed">
          <span className="text-primary font-bold">💡 Tip:</span>
          <span>
            Use Fleeting Notes for raw, incomplete ideas (e.g. quick bookmarks, article links, snippets).
            Promote them to full Knowledge Cards later when you have time to organize them.
          </span>
        </div>

        {/* Inbox List */}
        <div>
          <div className="text-[9px] font-black uppercase tracking-[4px] text-muted-foreground mb-3">
            In-Tray ({fleetingCards.length})
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : fleetingCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/60 text-[13px] bg-card border border-border/40 rounded-2xl p-6">
              ✏️ Inbox is empty. Good job!
            </div>
          ) : (
            <div className="space-y-3">
              {fleetingCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
                  style={{ borderLeft: "4px solid var(--muted-foreground)" }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase">
                      Captured {formatDistanceToNow(new Date(card.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-[13px] font-medium text-foreground leading-relaxed break-words">
                    {card.body}
                  </p>

                  <div className="flex gap-2 justify-end border-t border-border/10 pt-3">
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="text-destructive hover:bg-destructive/10 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Discard
                    </button>
                    <button
                      onClick={() => handleOpenPromote(card)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary font-black text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" /> Promote Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promote Modal */}
        {promotingCard && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
            <div className="bg-card border border-border/40 rounded-3xl w-full max-w-md overflow-y-auto max-h-[90vh] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-black text-foreground">
                  Promote to Knowledge Card
                </div>
                <button
                  onClick={handleClosePromote}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePromoteSave} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Design review summary"
                    className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Card Type Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Card Type
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(Object.keys(CARD_TYPE_CONFIG) as CardType[])
                      .filter((type) => type !== "fleeting")
                      .map((type) => {
                        const cfg = CARD_TYPE_CONFIG[type];
                        const isSelected = formType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setFormType(type);
                              setFormIcon(cfg.icon);
                            }}
                            className={`py-2 rounded-xl text-[10px] font-black transition-all border text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-muted/20 border-transparent text-muted-foreground"
                            }`}
                          >
                            <span className="text-base">{cfg.icon}</span>
                            {cfg.label}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Icon & Tags */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Icon
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground text-center focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formTagsString}
                      onChange={(e) => setFormTagsString(e.target.value)}
                      placeholder="e.g. productivity, work, study"
                      className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g. Bookmark, book, podcast"
                    className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Body Content */}
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Knowledge Content
                  </label>
                  <textarea
                    rows={4}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Add more context..."
                    className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] text-foreground resize-none focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  className="w-full font-black text-[14px] py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Edit3 size={16} />
                  )}
                  {saving ? "Promoting..." : "Save & Promote"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
