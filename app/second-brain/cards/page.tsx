"use client";

import React, { useEffect, useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { BRAIN_TABS } from "@/lib/navigation";
import { useBrain, CARD_TYPE_CONFIG, CardType, BrainCard } from "@/hooks/useBrain";
import { Loader2, Plus, Search, Tag, X, Edit3, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CardsPage() {
  const {
    fetchCards,
    getNonFleetingCards,
    createCard,
    updateCard,
    deleteCard,
    loading
  } = useBrain();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<BrainCard | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
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

  const cards = getNonFleetingCards();

  // Extract unique tags
  const allTags = Array.from(
    new Set(cards.flatMap((c) => c.tags || []).filter(Boolean))
  );

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.body || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.source || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || card.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const resetForm = () => {
    setFormTitle("");
    setFormType("idea");
    setFormBody("");
    setFormSource("");
    setFormTagsString("");
    setFormIcon("💡");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (card: BrainCard) => {
    setEditingCard(card);
    setFormTitle(card.title);
    setFormType(card.type);
    setFormBody(card.body || "");
    setFormSource(card.source || "");
    setFormTagsString(card.tags.join(", "));
    setFormIcon(card.icon || "💡");
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCard(null);
    resetForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    const tags = formTagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const cardData = {
      title: formTitle.trim(),
      type: formType,
      body: formBody.trim() || null,
      source: formSource.trim() || null,
      tags,
      icon: formIcon || CARD_TYPE_CONFIG[formType].icon,
    };

    let error;
    if (editingCard) {
      error = await updateCard(editingCard.id, cardData);
    } else {
      error = await createCard(cardData);
    }

    setSaving(false);
    if (error) {
      toast.error(editingCard ? "Failed to update card" : "Failed to create card");
    } else {
      toast.success(editingCard ? "Card updated! 🧠" : "Card created! 🧠");
      handleCloseModal();
      fetchCards();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    const error = await deleteCard(id);
    if (error) {
      toast.error("Failed to delete card");
    } else {
      toast.success("Card deleted");
      handleCloseModal();
      fetchCards();
    }
  };

  return (
    <PageWrapper title="Second Brain" sectionTabs={BRAIN_TABS}>
      <div className="space-y-5 page-stagger-container">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search your knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/30 border border-border/30 rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tags filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                !selectedTag
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground/75 hover:bg-muted/60"
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                  tag === selectedTag
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground/75 hover:bg-muted/60"
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Loading / Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card border border-border/40 rounded-2xl p-6">
            <span className="text-4xl">🧠</span>
            <div className="text-md font-black text-foreground">No knowledge cards found</div>
            <p className="text-[11px] text-muted-foreground max-w-[240px]">
              Start capturing your tattoo ideas, book summaries, or insights.
            </p>
            <button
              onClick={handleOpenCreate}
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              className="mt-2 font-black text-[13px] px-5 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Card
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card) => {
              const cfg = CARD_TYPE_CONFIG[card.type] || CARD_TYPE_CONFIG.idea;
              return (
                <div
                  key={card.id}
                  onClick={() => handleOpenEdit(card)}
                  className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${cfg.accentColor}` }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badgeClass}`}>
                      {card.icon} {cfg.label}
                    </span>
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase">
                      {format(new Date(card.created_at), "dd MMM yyyy")}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-black text-foreground">{card.title}</h3>

                  {card.body && (
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {card.body}
                    </p>
                  )}

                  {card.source && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{card.source}</span>
                    </div>
                  )}

                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide flex items-center gap-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating action button */}
        <button
          onClick={handleOpenCreate}
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all focus:outline-none"
        >
          <Plus size={24} />
        </button>

        {/* New / Edit Card Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
            <div className="bg-card border border-border/40 rounded-3xl w-full max-w-md overflow-y-auto max-h-[90vh] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-black text-foreground">
                  {editingCard ? "Edit Card" : "New Card"}
                </div>
                <div className="flex items-center gap-2">
                  {editingCard && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingCard.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      title="Delete card"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
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
                    placeholder="e.g. Forearm tattoo plan"
                    className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Type Selection */}
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
                            className={`py-2 rounded-xl text-[10px] font-black transition-all border text-center flex flex-col items-center justify-center gap-1 ${
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

                {/* Icon (Emoji) & Tags */}
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
                      placeholder="tattoo, ideas, stoicism"
                      className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Source (URL or Book reference)
                  </label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="https://pinterest.com/... or Meditations Book 4"
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
                    placeholder="Describe your idea or paste notes here..."
                    className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] text-foreground resize-none focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  className="w-full font-black text-[14px] py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Edit3 size={16} />
                  )}
                  {saving ? "Saving..." : editingCard ? "Update Card" : "Create Card"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
