"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { BRAIN_TABS } from "@/lib/navigation";
import { useBrain, CARD_TYPE_CONFIG, CardType, BrainCard } from "@/hooks/useBrain";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Loader2, Plus, Search, Tag, X, Edit3, Trash2, ExternalLink, Sparkles, Link as LinkIcon, AlertCircle, Trash, PlusCircle, ChevronUp, ChevronDown } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { EditorBlock, serializeBlocksToMarkdown, deserializeMarkdownToBlocks } from "@/lib/blockParser";
function stripMarkdown(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\|[ \t\-:|]+\|/g, "")
    .replace(/\|/g, " ")
    .replace(/^#+\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, "$1")
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function getMemoryStrength(card: BrainCard) {
  if (card.review_count === 0) {
    return { label: "New", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" };
  }
  if (card.review_interval_days <= 3) {
    return { label: "Fading", color: "bg-rose-500/10 text-rose-500 border border-rose-500/20" };
  }
  if (card.review_interval_days <= 14) {
    return { label: "Stable", color: "bg-amber-500/10 text-amber-600 border border-amber-500/20" };
  }
  return { label: "Anchored", color: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" };
}

function extractBoxHeadings(markdown: string | null): string[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const headings: string[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#### ")) {
      const headingText = trimmed.substring(5).trim();
      if (headingText) {
        headings.push(headingText);
      }
    }
  });
  return headings;
}

function getBoxHeadingsPreview(card: BrainCard): string[] {
  const explicitHeadings = extractBoxHeadings(card.body);
  if (explicitHeadings.length > 0) {
    return explicitHeadings;
  }
  try {
    const blocks = deserializeMarkdownToBlocks(card.body);
    return blocks.map((b) => {
      if (b.heading && b.heading.trim()) return b.heading.trim();
      switch (b.type) {
        case "paragraph": return "Text details";
        case "header": return b.text || "Heading";
        case "list": return "Bullet list";
        case "table": return "Spreadsheet table";
        case "quote": return "Inspirational quote";
        case "link": return `Web link: ${b.text || b.url || "Source"}`;
        default: return "Content section";
      }
    });
  } catch (e) {
    return ["Content section"];
  }
}

export default function CardsPage() {
  const {
    fetchCards,
    getNonFleetingCards,
    createCard,
    updateCard,
    deleteCard,
    rateCard,
    addLink,
    loading
  } = useBrain();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<BrainCard | null>(null);
  const [viewingCard, setViewingCard] = useState<BrainCard | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [surpriseCard, setSurpriseCard] = useState<BrainCard | null>(null);

  // Link UI states
  const [activeCardLinks, setActiveCardLinks] = useState<{ id: string; title: string; type: CardType; icon: string }[]>([]);
  const [linksCountMap, setLinksCountMap] = useState<Record<string, number>>({});
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<CardType>("idea");
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([]);
  const [formSource, setFormSource] = useState("");
  const [formTagsString, setFormTagsString] = useState("");
  const [formIcon, setFormIcon] = useState("💡");
  const [saving, setSaving] = useState(false);

  const addBlock = (type: "paragraph" | "header" | "list" | "table" | "quote" | "link") => {
    const newBlock: EditorBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      text: "",
      author: "",
      url: type === "link" ? "" : undefined,
      listItems: type === "list" ? [""] : undefined,
      tableRows: type === "table" ? [["Header 1", "Header 2"], ["", ""]] : undefined,
    };
    setEditorBlocks([...editorBlocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
    setEditorBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBlock = (id: string) => {
    if (editorBlocks.length <= 1) {
      toast.error("You must have at least one content block");
      return;
    }
    setEditorBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editorBlocks.length) return;
    
    setEditorBlocks((prev) => {
      const newBlocks = [...prev];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[targetIndex];
      newBlocks[targetIndex] = temp;
      return newBlocks;
    });
  };

  const cards = getNonFleetingCards();

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

      // Extract unique linked card IDs
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
      console.error("Failed to load links:", err);
    }
  }, []);

  const loadAllLinksCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("brain_links").select("from_card_id, to_card_id");
      if (error) throw error;
      if (!data) return;

      const countMap: Record<string, number> = {};
      data.forEach((l) => {
        countMap[l.from_card_id] = (countMap[l.from_card_id] || 0) + 1;
        countMap[l.to_card_id] = (countMap[l.to_card_id] || 0) + 1;
      });
      setLinksCountMap(countMap);
    } catch (err) {
      console.error("Failed to load links count:", err);
    }
  }, []);

  useEffect(() => {
    fetchCards();
    loadAllLinksCount();
  }, [fetchCards, loadAllLinksCount]);

  useEffect(() => {
    if (editingCard) {
      loadCardLinks(editingCard.id);
    } else if (viewingCard) {
      loadCardLinks(viewingCard.id);
    }
  }, [editingCard, viewingCard, loadCardLinks]);

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

  // Calculate last 14 days heatmap
  const last14Days = Array.from({ length: 14 }).map((_, i) => subDays(new Date(), 13 - i));
  const getDayNotesCount = (date: Date) => {
    return cards.filter((c) => isSameDay(new Date(c.created_at), date)).length;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-muted/30 border border-border/10";
    if (count === 1) return "bg-primary/20 border border-primary/30";
    if (count === 2) return "bg-primary/45 border border-primary/50 text-white";
    return "bg-primary text-white border border-primary/80";
  };

  // Surprise Me serendipity logic
  const handleSurpriseMe = () => {
    if (cards.length === 0) {
      toast.error("You have no cards to select from yet");
      return;
    }
    const randomIndex = Math.floor(Math.random() * cards.length);
    setSurpriseCard(cards[randomIndex]);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormType("idea");
    setEditorBlocks([{ id: Math.random().toString(36).substring(2, 9), type: "paragraph", text: "" }]);
    setFormSource("");
    setFormTagsString("");
    setFormIcon("💡");
    setActiveCardLinks([]);
    setLinkSearchQuery("");
    setShowLinkDropdown(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (card: BrainCard) => {
    setEditingCard(card);
    setFormTitle(card.title);
    setFormType(card.type);
    setEditorBlocks(deserializeMarkdownToBlocks(card.body));
    setFormSource(card.source || "");
    setFormTagsString(card.tags.join(", "));
    setFormIcon(card.icon || "💡");
    setIsCreateModalOpen(true);
  };

  const handleOpenView = (card: BrainCard) => {
    setViewingCard(card);
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
      body: serializeBlocksToMarkdown(editorBlocks),
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

  // Link selector logic
  const handleAddLink = async (targetCardId: string) => {
    if (!editingCard) return;
    const error = await addLink(editingCard.id, targetCardId);
    if (error) {
      toast.error("Connection already exists or failed to link");
    } else {
      toast.success("Cards linked! 🔗");
      loadCardLinks(editingCard.id);
      setLinkSearchQuery("");
      setShowLinkDropdown(false);
    }
  };

  const handleRemoveLink = async (targetCardId: string) => {
    if (!editingCard) return;
    if (!confirm("Are you sure you want to unlink these cards?")) return;
    try {
      const { error } = await supabase
        .from("brain_links")
        .delete()
        .or(`and(from_card_id.eq.${editingCard.id},to_card_id.eq.${targetCardId}),and(from_card_id.eq.${targetCardId},to_card_id.eq.${editingCard.id})`);

      if (error) throw error;
      toast.success("Cards unlinked");
      loadCardLinks(editingCard.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to unlink cards");
    }
  };

  // Spaced repetition review from Serendipity modal
  const handleRateSerendipity = async (rating: "hard" | "medium" | "easy") => {
    if (!surpriseCard) return;
    const error = await rateCard(surpriseCard, rating);
    if (error) {
      toast.error("Failed to reschedule card");
    } else {
      toast.success("Card review rescheduled! 🃏");
      setSurpriseCard(null);
      fetchCards();
    }
  };

  const linkableCards = cards.filter(
    (c) =>
      editingCard &&
      c.id !== editingCard.id &&
      !activeCardLinks.some((l) => l.id === c.id) &&
      c.title.toLowerCase().includes(linkSearchQuery.toLowerCase())
  );

  return (
    <PageWrapper title="Second Brain" sectionTabs={BRAIN_TABS}>
      <div className="space-y-5 page-stagger-container">
        {/* Heatmap & Metrics Widget */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Knowledge Heatmap
              </span>
              <span className="text-[13px] font-black text-foreground mt-0.5">
                {cards.length} Active Notes Vault
              </span>
            </div>
            <button
              onClick={handleSurpriseMe}
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Surprise Me
            </button>
          </div>

          <div className="flex justify-between items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {last14Days.map((date, i) => {
              const count = getDayNotesCount(date);
              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-[6px] flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all ${getHeatmapColor(
                    count
                  )}`}
                  title={`${count} notes added on ${format(date, "MMM dd")}`}
                >
                  {format(date, "dd")}
                </div>
              );
            })}
          </div>
        </div>

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
              Start capturing your thoughts, book summaries, or insights.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredCards.map((card) => {
              const cfg = CARD_TYPE_CONFIG[card.type] || CARD_TYPE_CONFIG.idea;
              const memory = getMemoryStrength(card);
              const linksCount = linksCountMap[card.id] || 0;
              const textPreview = stripMarkdown(card.body);

              return (
                <div
                  key={card.id}
                  onClick={() => handleOpenView(card)}
                  className="bg-card border border-border/40 hover:border-primary/30 rounded-2xl p-4 flex flex-col justify-between min-h-[140px] hover:shadow-md active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${cfg.accentColor}` }}
                >
                  <div className="space-y-2">
                    {/* Top Row: Type & Memory Strength */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${cfg.badgeClass}`}>
                        {card.icon} {cfg.label}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${memory.color}`}>
                        🧠 {memory.label}
                      </span>
                    </div>

                    {/* Middle Block: Title & Content Box Headings */}
                    <div className="space-y-1.5">
                      <h3 className="text-[14px] font-black text-foreground tracking-tight leading-tight line-clamp-1">
                        {card.title}
                      </h3>
                      <div className="space-y-1">
                        {getBoxHeadingsPreview(card).slice(0, 3).map((h, hIdx) => (
                          <div key={hIdx} className="text-[10px] text-muted-foreground/75 flex items-center gap-1.5 font-black uppercase tracking-wider truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Tags & Metadata (links + date) */}
                  <div className="flex items-center justify-between border-t border-border/10 pt-2.5 mt-3 gap-2">
                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1 max-w-[65%] overflow-hidden">
                      {card.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-muted/40 text-muted-foreground/90 px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wide truncate"
                        >
                          #{tag}
                        </span>
                      ))}
                      {card.tags.length > 2 && (
                        <span className="text-[8px] text-muted-foreground/50 font-bold">
                          +{card.tags.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 shrink-0">
                      {linksCount > 0 && (
                        <span className="flex items-center gap-0.5 text-primary bg-primary/5 px-1 py-0.5 rounded border border-primary/10">
                          <LinkIcon className="w-2.5 h-2.5" />
                          {linksCount}
                        </span>
                      )}
                      <span>
                        {format(new Date(card.created_at), "dd MMM")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating action button */}
        <button
          onClick={handleOpenCreate}
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all focus:outline-none cursor-pointer"
        >
          <Plus size={24} />
        </button>

        {/* Surprise Me Serendipity Modal Overlay */}
        {surpriseCard && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div
              className="bg-card border border-border/40 rounded-3xl w-full max-w-md p-6 space-y-4 relative overflow-hidden shadow-2xl"
              style={{ borderTop: `6px solid ${(CARD_TYPE_CONFIG[surpriseCard.type] || CARD_TYPE_CONFIG.idea).accentColor}` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    (CARD_TYPE_CONFIG[surpriseCard.type] || CARD_TYPE_CONFIG.idea).badgeClass
                  }`}
                >
                  {surpriseCard.icon} {(CARD_TYPE_CONFIG[surpriseCard.type] || CARD_TYPE_CONFIG.idea).label}
                </span>
                <button
                  onClick={() => setSurpriseCard(null)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Serendipity Engine Note
                </span>
                <h2 className="text-[18px] font-black text-foreground leading-snug">
                  {surpriseCard.title}
                </h2>
              </div>

              {surpriseCard.source && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{surpriseCard.source}</span>
                </div>
              )}

              {/* Render with Markdown parser */}
              <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2 border-t border-b border-border/20 text-[13px] text-foreground leading-relaxed">
                <MarkdownRenderer content={surpriseCard.body || ""} />
              </div>

              {/* Spaced repetition rating row */}
              <div className="space-y-2 pt-1">
                <div className="text-[9px] font-black uppercase text-muted-foreground text-center tracking-wider">
                  How well did you remember this?
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleRateSerendipity("hard")}
                    className="flex-1 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    🔴 Hard
                  </button>
                  <button
                    onClick={() => handleRateSerendipity("medium")}
                    className="flex-1 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    🟡 Medium
                  </button>
                  <button
                    onClick={() => handleRateSerendipity("easy")}
                    className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    🟢 Easy
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    handleOpenEdit(surpriseCard);
                    setSurpriseCard(null);
                  }}
                  className="bg-muted hover:bg-muted-foreground/10 text-foreground font-bold text-[11px] px-3.5 py-2 rounded-lg transition-all"
                >
                  Edit Note
                </button>
              </div>
            </div>
          </div>
        )}

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
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer"
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
                    placeholder="e.g. Design meeting outline or book highlights"
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
                      placeholder="e.g. project, coding, book-notes"
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
                    placeholder="https://github.com/... or Atomic Habits Page 42"
                    className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Body Content */}
                <div className="space-y-3.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Knowledge Blocks
                  </label>

                  {/* Render Active Blocks */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                    {editorBlocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className="bg-muted/10 border border-border/20 p-3.5 rounded-2xl space-y-3 relative group"
                      >
                        {/* Block Action Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/10">
                          <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80">
                            Block #{idx + 1} · {block.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveBlock(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(idx, "down")}
                              disabled={idx === editorBlocks.length - 1}
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBlock(block.id)}
                              className="p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-colors cursor-pointer"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Block Heading Context Box */}
                        <div className="space-y-0.5">
                          <label className="text-[9.5px] font-black uppercase text-muted-foreground/70 tracking-widest">
                            Box Heading
                          </label>
                          <input
                            type="text"
                            value={block.heading || ""}
                            onChange={(e) => updateBlock(block.id, { heading: e.target.value })}
                            placeholder="Give this box a heading (optional)..."
                            className="w-full bg-card border border-border/30 rounded-xl px-3 py-2 text-[11.5px] font-bold text-foreground focus:outline-none focus:border-primary/50"
                          />
                        </div>

                        {/* Block Type Inputs */}
                        {block.type === "paragraph" && (
                          <textarea
                            value={block.text || ""}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Type paragraph text..."
                            rows={2}
                            className="w-full bg-card border border-border/30 rounded-xl px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50 resize-none"
                          />
                        )}

                        {block.type === "header" && (
                          <input
                            type="text"
                            value={block.text || ""}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Heading title..."
                            className="w-full bg-card border border-border/30 rounded-xl px-3 py-2 text-[13px] font-black text-foreground focus:outline-none focus:border-primary/50"
                          />
                        )}

                        {block.type === "quote" && (
                          <div className="space-y-2">
                            <textarea
                              value={block.text || ""}
                              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                              placeholder="Quote content..."
                              rows={2}
                              className="w-full bg-card border border-border/30 rounded-xl px-3 py-2 text-[12px] text-foreground italic focus:outline-none focus:border-primary/50 resize-none"
                            />
                            <input
                              type="text"
                              value={block.author || ""}
                              onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                              placeholder="Author / source..."
                              className="w-full bg-card border border-border/30 rounded-xl px-3 py-1.5 text-[11px] font-bold text-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        )}

                        {block.type === "list" && (
                          <div className="space-y-2">
                            {(block.listItems || []).map((item: string, itemIdx: number) => (
                              <div key={itemIdx} className="flex items-center gap-1.5">
                                <span className="text-[12px] text-muted-foreground font-black">•</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const nextItems = [...(block.listItems || [])];
                                    nextItems[itemIdx] = e.target.value;
                                    updateBlock(block.id, { listItems: nextItems });
                                  }}
                                  placeholder="List item content..."
                                  className="flex-1 bg-card border border-border/30 rounded-xl px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextItems = (block.listItems || []).filter((_: any, ii: number) => ii !== itemIdx);
                                    updateBlock(block.id, { listItems: nextItems.length > 0 ? nextItems : [""] });
                                  }}
                                  className="p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-colors cursor-pointer"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                updateBlock(block.id, { listItems: [...(block.listItems || []), ""] });
                              }}
                              className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} /> Add list item
                            </button>
                          </div>
                        )}

                        {block.type === "link" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase text-muted-foreground/80 tracking-wider">
                                Display Text
                              </label>
                              <input
                                type="text"
                                value={block.text || ""}
                                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                placeholder="e.g. Visit Website"
                                className="mt-1 w-full bg-card border border-border/30 rounded-xl px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-muted-foreground/80 tracking-wider">
                                Link URL
                              </label>
                              <input
                                type="text"
                                value={block.url || ""}
                                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                placeholder="e.g. https://google.com"
                                className="mt-1 w-full bg-card border border-border/30 rounded-xl px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
                              />
                            </div>
                          </div>
                        )}

                        {block.type === "table" && (
                          <div className="space-y-2.5">
                            <div className="overflow-x-auto border border-border/30 rounded-xl bg-card">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="border-b border-border/30 bg-muted/20">
                                    {(block.tableRows?.[0] || []).map((header: string, colIdx: number) => (
                                      <th key={colIdx} className="p-1.5">
                                        <input
                                          type="text"
                                          value={header}
                                          onChange={(e) => {
                                            const nextRows = (block.tableRows || []).map((row: string[], rIdx: number) => {
                                              if (rIdx === 0) {
                                                const newRow = [...row];
                                                newRow[colIdx] = e.target.value;
                                                return newRow;
                                              }
                                              return row;
                                            });
                                            updateBlock(block.id, { tableRows: nextRows });
                                          }}
                                          placeholder={`Header ${colIdx + 1}`}
                                          className="w-full bg-transparent font-black text-muted-foreground uppercase text-center focus:outline-none"
                                        />
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(block.tableRows || []).slice(1).map((row: string[], rIdx: number) => (
                                    <tr key={rIdx} className="border-b border-border/20 last:border-0">
                                      {row.map((cell: string, colIdx: number) => (
                                        <td key={colIdx} className="p-1.5">
                                          <input
                                            type="text"
                                            value={cell}
                                            onChange={(e) => {
                                              const nextRows = (block.tableRows || []).map((currentRow: string[], currentRowIdx: number) => {
                                                if (currentRowIdx === rIdx + 1) {
                                                  const newRow = [...currentRow];
                                                  newRow[colIdx] = e.target.value;
                                                  return newRow;
                                                }
                                                return currentRow;
                                              });
                                              updateBlock(block.id, { tableRows: nextRows });
                                            }}
                                            placeholder="Cell data"
                                            className="w-full bg-transparent text-center text-foreground font-medium focus:outline-none"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Table editor controls */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentColsCount = block.tableRows?.[0]?.length || 2;
                                  const newRow = Array(currentColsCount).fill("");
                                  updateBlock(block.id, { tableRows: [...(block.tableRows || []), newRow] });
                                }}
                                className="flex-1 bg-muted/40 hover:bg-muted/70 text-[9px] font-black py-1 rounded-md transition-all cursor-pointer"
                              >
                                + Row
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if ((block.tableRows?.length || 0) <= 2) return;
                                  updateBlock(block.id, { tableRows: (block.tableRows || []).slice(0, -1) });
                                }}
                                className="flex-1 bg-muted/40 hover:bg-muted/70 text-[9px] font-black py-1 rounded-md transition-all cursor-pointer"
                              >
                                - Row
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextRows = (block.tableRows || []).map((row: string[]) => [...row, ""]);
                                  updateBlock(block.id, { tableRows: nextRows });
                                }}
                                className="flex-1 bg-muted/40 hover:bg-muted/70 text-[9px] font-black py-1 rounded-md transition-all cursor-pointer"
                              >
                                + Col
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if ((block.tableRows?.[0]?.length || 0) <= 1) return;
                                  const nextRows = (block.tableRows || []).map((row: string[]) => row.slice(0, -1));
                                  updateBlock(block.id, { tableRows: nextRows });
                                }}
                                className="flex-1 bg-muted/40 hover:bg-muted/70 text-[9px] font-black py-1 rounded-md transition-all cursor-pointer"
                              >
                                - Col
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Block Selector Toolbar */}
                  <div className="border-t border-border/10 pt-3">
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
                      + Insert Content Block
                    </span>
                    <div className="grid grid-cols-6 gap-1.5">
                      <button
                        type="button"
                        onClick={() => addBlock("paragraph")}
                        className="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("header")}
                        className="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("list")}
                        className="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        List
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("table")}
                        className="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        Table
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("quote")}
                        className="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("link")}
                        className="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bidirectional Linking System (Only for editing existing cards) */}
                {editingCard && (
                  <div className="border-t border-border/20 pt-4 space-y-3.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Bidirectional Links
                      </span>
                    </div>

                    {/* Linked items chips */}
                    {activeCardLinks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activeCardLinks.map((linked) => (
                          <div
                            key={linked.id}
                            className="bg-primary/5 text-primary border border-primary/20 pl-2 pr-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <span
                              onClick={() => {
                                // Jump directly to the editing card
                                const matched = cards.find((c) => c.id === linked.id);
                                if (matched) {
                                  handleOpenEdit(matched);
                                }
                              }}
                              className="cursor-pointer hover:underline"
                            >
                              {linked.icon} {linked.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(linked.id)}
                              className="hover:bg-primary/10 text-primary p-0.5 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground/60 italic">No links connected to this card.</div>
                    )}

                    {/* Add new link search selector */}
                    <div className="relative">
                      <div className="flex items-center gap-1.5 bg-muted/30 border border-border/30 rounded-xl px-3 py-1.5">
                        <Search className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <input
                          type="text"
                          placeholder="Search card to link..."
                          value={linkSearchQuery}
                          onChange={(e) => {
                            setLinkSearchQuery(e.target.value);
                            setShowLinkDropdown(true);
                          }}
                          onFocus={() => setShowLinkDropdown(true)}
                          className="flex-1 bg-transparent text-[11px] font-bold text-foreground focus:outline-none"
                        />
                        {linkSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setLinkSearchQuery("");
                              setShowLinkDropdown(false);
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown results */}
                      {showLinkDropdown && linkSearchQuery.trim() && (
                        <div className="absolute left-0 right-0 mt-1 bg-card border border-border/40 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto no-scrollbar py-1">
                          {linkableCards.length === 0 ? (
                            <div className="px-3 py-2 text-[11px] text-muted-foreground italic text-center">
                              No matching linkable cards
                            </div>
                          ) : (
                            linkableCards.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleAddLink(c.id)}
                                className="w-full text-left px-3 py-2 hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1.5 border-b border-border/10 last:border-0"
                              >
                                <span>{c.icon}</span>
                                <span className="truncate flex-1">{c.title}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  {saving ? "Saving..." : editingCard ? "Update Card" : "Create Card"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Card Details Modal Overlay */}
        {viewingCard && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div
              className="bg-card border border-border/40 rounded-3xl w-full max-w-md p-6 space-y-4 relative overflow-hidden shadow-2xl"
              style={{ borderTop: `6px solid ${(CARD_TYPE_CONFIG[viewingCard.type] || CARD_TYPE_CONFIG.idea).accentColor}` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    (CARD_TYPE_CONFIG[viewingCard.type] || CARD_TYPE_CONFIG.idea).badgeClass
                  }`}
                >
                  {viewingCard.icon} {(CARD_TYPE_CONFIG[viewingCard.type] || CARD_TYPE_CONFIG.idea).label}
                </span>
                <button
                  onClick={() => setViewingCard(null)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-[18px] font-black text-foreground leading-snug">
                  {viewingCard.title}
                </h2>
                {viewingCard.source && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{viewingCard.source}</span>
                  </div>
                )}
              </div>

              {/* Render content dynamically with MarkdownRenderer */}
              <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2 border-t border-b border-border/20 text-[13px] text-foreground leading-relaxed">
                <MarkdownRenderer content={viewingCard.body || ""} />
              </div>

              {/* Display bidirectional links */}
              {activeCardLinks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Linked Cards
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeCardLinks.map((link) => (
                      <span
                        key={link.id}
                        onClick={() => {
                          const matched = cards.find((c) => c.id === link.id);
                          if (matched) {
                            handleOpenView(matched);
                          }
                        }}
                        className="bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer hover:bg-primary/10 transition-colors"
                      >
                        {link.icon} {link.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {viewingCard.tags && viewingCard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {viewingCard.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom buttons bar */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    handleOpenEdit(viewingCard);
                    setViewingCard(null);
                  }}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Edit Note
                </button>
                <button
                  onClick={() => setViewingCard(null)}
                  className="bg-muted hover:bg-muted-foreground/10 text-foreground font-bold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
