"use client";
import { Select } from "@/components/Select";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, ArrowLeft, ArrowRightLeft, Box, Calendar, Check, ChevronRight, Clock, Filter, Gift, History, Home, IndianRupee, Info, MapPin, MoreVertical, Move, Package, Plus, PlusCircle, Search, Share2, Trash2, User, Users, X , BarChart2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { format, differenceInDays } from "date-fns";

// --- Types ---

type OriginType = 'bought' | 'gifted_in' | 'borrowed';
type ItemStatus = 'active' | 'lent_out' | 'retired';
type RetiredReason = 'worn_out' | 'gifted_out' | 'lost' | 'stolen' | 'sold' | 'returned';
type ViewMode = 'HOME' | 'LOCATION' | 'PEOPLE' | 'RETIRED' | 'SEARCH';

interface Location {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  type: string;
}

interface Item {
  id: string;
  name: string;
  location_id: string | null;
  quantity: number;
  category: string | null;
  tags: string[] | null;
  notes: string | null;
  origin_type: OriginType;
  origin_person: string | null;
  acquired_date: string | null;
  purchase_price: number | null;
  condition: string;
  status: ItemStatus;
  lent_to_person: string | null;
  lent_date: string | null;
  return_due_date: string | null;
  retired_reason: RetiredReason | null;
  retired_at: string | null;
  retired_to_person: string | null;
  created_at: string;
}

// --- Helper Components ---

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${className}`}>
    {children}
  </span>
);

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
      <div className="bg-card w-full max-w-sm rounded-[32px] shadow-2xl border border-border/40 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-all"><X size={20} /></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );

export default function InventoryPage() {
  // Navigation & View State
  const [view, setView] = useState<ViewMode>('HOME');
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [history, setHistory] = useState<{id: string | null, name: string}[]>([]);
  
  // Data State
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllNested, setShowAllNested] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return items.filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.tags && i.tags.join(' ').toLowerCase().includes(q)) || 
      (i.category && i.category.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePath, setMovePath] = useState<{id: string | null, name: string}[]>([]);
  const [moveDestinations, setMoveDestinations] = useState<Location[]>([]);

  // Form States
  const [newLocName, setNewLocName] = useState("");
  const [newLocIcon, setNewLocIcon] = useState("📦");
  const [newLocType, setNewLocType] = useState("other");
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemOrigin, setNewItemOrigin] = useState<OriginType>('bought');
  const [newItemOriginPerson, setNewItemOriginPerson] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  const [retireReason, setRetireReason] = useState<RetiredReason>('worn_out');
  const [retireToPerson, setRetireToPerson] = useState("");
  
  const [lendToPerson, setLendToPerson] = useState("");
  const [lendDueDate, setLendDueDate] = useState("");

  // --- Data Fetching ---

  useEffect(() => {
    fetchData();
  }, [view, currentLocationId, showAllNested]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (view === 'HOME') {
        const { data: locs, error: locError } = await supabase.from('inventory_locations').select('*').is('parent_id', null).order('name');
        if (locError) throw locError;
        setLocations(locs || []);
        
        // Quick stats (optional, but let's check for errors)
        const { error: countError } = await supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('status', 'active');
        if (countError) console.warn("Stats fetch error:", countError);
        
        // Fetch all active items for quick search when transitioning to search view
        const { data: allActive } = await supabase.from('inventory_items').select('*').eq('status', 'active');
        if (allActive) setItems(allActive);
      } 
      else if (view === 'LOCATION' && currentLocationId) {
        const { data: subLocs, error: subLocError } = await supabase.from('inventory_locations').select('*').eq('parent_id', currentLocationId).order('name');
        if (subLocError) throw subLocError;
        setLocations(subLocs || []);

        if (showAllNested) {
          await fetchNestedItems(currentLocationId);
        } else {
          const { data: locItems, error: itemError } = await supabase.from('inventory_items').select('*').eq('location_id', currentLocationId).eq('status', 'active').order('name');
          if (itemError) throw itemError;
          setItems(locItems || []);
        }
      }
      else if (view === 'PEOPLE') {
        const { data: lentItems, error: lentError } = await supabase.from('inventory_items').select('*').eq('status', 'lent_out').order('lent_date', { ascending: false });
        const { data: borrowedItems, error: borrowedError } = await supabase.from('inventory_items').select('*').eq('origin_type', 'borrowed').eq('status', 'active').order('acquired_date', { ascending: false });
        if (lentError) throw lentError;
        if (borrowedError) throw borrowedError;
        setItems([...(lentItems || []), ...(borrowedItems || [])]);
      }
      else if (view === 'RETIRED') {
        const { data: retItems, error: retError } = await supabase.from('inventory_items').select('*').eq('status', 'retired').order('retired_at', { ascending: false });
        if (retError) throw retError;
        setItems(retItems || []);
      }
    } catch (error: any) {
      console.error("Inventory Fetch Error:", error);
      toast.error(error.message || "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNestedItems = async (locId: string) => {
    // Simplified recursive fetch for small trees
    // 1. Get all location IDs in the subtree
    const allLocIds = [locId];
    let toProcess = [locId];
    
    let depth = 0;
    while (toProcess.length > 0 && depth < 10) {
      depth++;
      const { data: children } = await supabase.from('inventory_locations').select('id').in('parent_id', toProcess);
      if (children && children.length > 0) {
        const ids = children.map(c => c.id);
        allLocIds.push(...ids);
        toProcess = ids;
      } else {
        toProcess = [];
      }
    }
    
    // 2. Fetch items for all these locations
    const { data: nestedItems } = await supabase.from('inventory_items').select('*').in('location_id', allLocIds).eq('status', 'active');
    setItems(nestedItems || []);
  };

  const loadMoveFolder = async (parentId: string | null) => {
    try {
      let query = supabase.from('inventory_locations').select('*');
      if (parentId) query = query.eq('parent_id', parentId);
      else query = query.is('parent_id', null);
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      setMoveDestinations(data || []);
    } catch (e) {
      toast.error("Failed to load destinations");
    }
  };

  const handleMoveConfirm = async (destId: string | null) => {
    if (!selectedItem) return;
    if (!destId) {
      toast.error("Please select a valid destination");
      return;
    }
    try {
      const { error } = await supabase.from('inventory_items').update({
        location_id: destId
      }).eq('id', selectedItem.id);
      
      if (error) throw error;
      
      toast.success("Item moved successfully");
      setShowMoveModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Move failed");
    }
  };

  // --- Handlers ---

  const handleNavigateToLocation = (loc: Location) => {
    setHistory([...history, { id: loc.id, name: loc.name }]);
    setCurrentLocationId(loc.id);
    setView('LOCATION');
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      const prev = newHistory[newHistory.length - 1];
      setCurrentLocationId(prev ? prev.id : null);
      if (!prev) setView('HOME');
    } else {
      setView('HOME');
    }
  };

  const handleDeleteLocation = async () => {
    if (!currentLocationId) return;
    const confirm = window.confirm("Are you sure? This will delete this location and all its sub-folders. Items will be un-categorized.");
    if (!confirm) return;
    
    try {
      const { data: subs } = await supabase.from('inventory_locations').select('id').eq('parent_id', currentLocationId).limit(1);
      if (subs && subs.length > 0) {
        toast.error("Please delete or move all sub-folders first to prevent database cascading failure.");
        return;
      }
      const { error } = await supabase.from('inventory_locations').delete().eq('id', currentLocationId);
      if (error) throw error;
      
      toast.success("Location deleted");
      handleGoBack();
      fetchData();
    } catch (e: any) {
      toast.error("Deletion failed");
    }
  };

  const handleAddLocation = async () => {
    if (!newLocName.trim()) return;
    try {
      const payload = {
        name: newLocName,
        parent_id: currentLocationId || null,
        icon: newLocIcon,
        type: newLocType
      };
      
      const { error } = await supabase.from('inventory_locations').insert(payload);
      
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }
      
      toast.success("Location added");
      setShowAddLocationModal(false);
      setNewLocName("");
      fetchData();
    } catch (e: any) { 
      console.error("Add Location Exception:", e);
      toast.error(e.message || e.details || "Failed to add location"); 
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      const { error } = await supabase.from('inventory_items').insert({
        name: newItemName,
        location_id: currentLocationId,
        origin_type: newItemOrigin,
        origin_person: newItemOriginPerson || null,
        category: newItemCategory || null,
        purchase_price: newItemPrice ? parseFloat(newItemPrice) : null,
        notes: newItemNotes || null,
        status: 'active'
      });
      if (error) throw error;
      toast.success("Item added");
      setShowAddItemModal(false);
      setNewItemName("");
      setNewItemOrigin('bought');
      setNewItemOriginPerson("");
      fetchData();
    } catch (e: any) { 
      console.error(e);
      toast.error(e.message || "Failed to add item"); 
    }
  };

  const handleRetireItem = async () => {
    if (!selectedItem) return;
    try {
      const { error } = await supabase.from('inventory_items').update({
        status: 'retired',
        retired_reason: retireReason,
        retired_at: new Date().toISOString(),
        retired_to_person: retireToPerson || null
      }).eq('id', selectedItem.id);
      if (error) throw error;
      toast.success(`Item retired: ${retireReason.replace('_', ' ')}`);
      setShowRetireModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (e: any) { 
      console.error(e);
      toast.error(e.message || "Retirement failed"); 
    }
  };

  const handleLendItem = async () => {
    if (!selectedItem || !lendToPerson.trim()) return;
    try {
      const { error } = await supabase.from('inventory_items').update({
        status: 'lent_out',
        lent_to_person: lendToPerson,
        lent_date: new Date().toISOString().split('T')[0],
        return_due_date: lendDueDate || null
      }).eq('id', selectedItem.id);
      if (error) throw error;
      toast.success(`Lent to ${lendToPerson}`);
      setShowLendModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (e: any) { 
      console.error(e);
      toast.error(e.message || "Lending failed"); 
    }
  };

  const handleUpdateCondition = async (newCondition: string) => {
    if (!selectedItem) return;
    try {
      const { error } = await supabase.from('inventory_items').update({
        condition: newCondition
      }).eq('id', selectedItem.id);
      if (error) throw error;
      setSelectedItem({ ...selectedItem, condition: newCondition });
      toast.success("Condition updated");
      fetchData();
    } catch (e: any) {
      toast.error("Update failed");
    }
  };

  const handleReturnToPossession = async (item: Item) => {
    try {
      const { error } = await supabase.from('inventory_items').update({
        status: 'active',
        lent_to_person: null,
        lent_date: null,
        return_due_date: null
      }).eq('id', item.id);
      if (error) throw error;
      toast.success("Returned to active inventory");
      fetchData();
    } catch (e: any) { 
      console.error(e);
      toast.error(e.message || "Update failed"); 
    }
  };

  // --- Render Sections ---

  const renderHome = () => (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/40 flex items-center gap-3">
        <Search size={18} className="text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search items, locations..." 
          className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setView('SEARCH')}
        />
      </div>

      {/* Stats row would go here if needed */}

      <div className="grid grid-cols-2 gap-3">
        {locations.map(loc => (
          <button 
            key={loc.id} 
            onClick={() => handleNavigateToLocation(loc)}
            className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-zenith transition-all group text-left flex flex-col gap-4"
          >
            <div className="text-3xl transition-transform group-hover:scale-110">{loc.icon || '📍'}</div>
            <div>
              <div className="text-sm font-black">{loc.name}</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{loc.type}</div>
            </div>
          </button>
        ))}
        <button 
          onClick={() => setShowAddLocationModal(true)}
          className="bg-muted/30 rounded-2xl p-6 border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-all"
        >
          <Plus size={24} />
          <span className="text-[10px] font-black">New Root</span>
        </button>
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          onClick={() => setView('PEOPLE')}
          className="flex-1 bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all"
        >
          <Users size={18} className="text-accent" />
          <span className="text-xs font-black">People</span>
        </button>
        <button 
          onClick={() => setView('RETIRED')}
          className="flex-1 bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all"
        >
          <History size={18} className="text-primary" />
          <span className="text-xs font-black">Retired</span>
        </button>
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/10 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 pr-4">
          <button onClick={() => setView('HOME')} className="p-2 hover:bg-muted rounded-lg transition-all shrink-0"><Home size={18} /></button>
          {history.map((h, i) => (
            <React.Fragment key={`${h.id}-${i}`}>
              <ChevronRight size={14} className="text-muted-foreground/30 shrink-0" />
              <button 
                onClick={() => {
                  const newHist = history.slice(0, i + 1);
                  setHistory(newHist);
                  setCurrentLocationId(h.id);
                }}
                className={`text-xs font-black shrink-0 ${i === history.length - 1 ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {h.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <button 
          onClick={handleDeleteLocation}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Sub-locations */}
      {locations.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground/50 ml-1">Sub-locations</div>
          <div className="grid grid-cols-2 gap-2">
            {locations.map(loc => (
              <button 
                key={loc.id} 
                onClick={() => handleNavigateToLocation(loc)}
                className="bg-card rounded-xl p-4 border border-border/40 shadow-sm flex items-center gap-3 hover:bg-muted transition-all text-left"
              >
                <span className="text-xl">{loc.icon || '📂'}</span>
                <span className="text-xs font-bold truncate">{loc.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between ml-1">
          <div className="text-[10px] font-bold text-muted-foreground/50">Items</div>
          <button 
            onClick={() => setShowAllNested(!showAllNested)}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${showAllNested ? 'bg-primary text-white border-primary' : 'bg-muted/50 text-muted-foreground border-border/40'}`}
          >
            {showAllNested ? 'Showing All' : 'Show All Nested'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map(item => (
            <button 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-card rounded-xl p-4 border border-border/40 shadow-sm flex items-center gap-3 hover:border-accent/40 transition-all text-left group"
            >
              <div className="w-8 h-8 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors shrink-0">
                <Package size={16} />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold truncate">{item.name}</div>
                {item.quantity > 1 && <div className="text-[9px] font-medium text-muted-foreground">Qty: {item.quantity}</div>}
              </div>
            </button>
          ))}
          
          {items.length === 0 && !isLoading && (
            <div className="col-span-2 text-center py-12 border-2 border-dashed border-muted/50 rounded-2xl text-muted-foreground/40 font-bold text-[10px]">
              No items here
            </div>
          )}
        </div>
      </div>

      {/* Floating Actions */}
      <div className="flex gap-3 pt-6">
        <button 
          onClick={() => setShowAddLocationModal(true)}
          className="flex-1 bg-card rounded-2xl h-14 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all"
        >
          <Plus size={18} className="text-accent" />
          <span className="text-xs font-bold">Sub-location</span>
        </button>
        <button 
          onClick={() => setShowAddItemModal(true)}
          className="flex-1 bg-primary text-white rounded-2xl h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <PlusCircle size={18} />
          <span className="text-xs font-bold">Add Item</span>
        </button>
      </div>
    </div>
  );

  const renderPeople = () => {
    const lent = items.filter(i => i.status === 'lent_out');
    const borrowed = items.filter(i => i.origin_type === 'borrowed' && i.status === 'active');
    
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('HOME')} className="p-3 bg-card rounded-xl border border-border/40 shadow-sm hover:bg-muted transition-all"><ArrowLeft size={18} /></button>
          <h2 className="text-2xl font-bold">People Tracker</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-amber-600 flex items-center gap-2">
              <ArrowRightLeft size={14} /> I borrowed (To Return)
            </div>
            <div className="space-y-2">
              {borrowed.map(item => (
                <div key={item.id} className="bg-card rounded-xl p-4 border border-border/40 shadow-sm flex justify-between items-center">
                   <div>
                    <div className="text-sm font-bold">{item.name}</div>
                    <div className="text-[10px] font-medium text-muted-foreground mt-1">From: <span className="text-primary">{item.origin_person}</span></div>
                   </div>
                   <button 
                    onClick={() => {
                      setSelectedItem(item);
                      setRetireReason('returned');
                      setShowRetireModal(true);
                    }}
                    className="text-[9px] font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition-all"
                   >
                    Return
                   </button>
                </div>
              ))}
              {borrowed.length === 0 && <div className="text-center py-8 text-muted-foreground/30 font-bold text-[9px]">No active borrowings</div>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-bold text-accent flex items-center gap-2">
              <Share2 size={14} /> I lent (They have mine)
            </div>
            <div className="space-y-2">
              {lent.map(item => (
                <div key={item.id} className="bg-card rounded-xl p-4 border border-border/40 shadow-sm flex justify-between items-center">
                   <div>
                    <div className="text-sm font-bold">{item.name}</div>
                    <div className="text-[10px] font-medium text-muted-foreground mt-1">Lent to: <span className="text-primary">{item.lent_to_person}</span></div>
                    {item.lent_date && <div className="text-[9px] text-muted-foreground/60 mt-0.5">On {format(new Date(item.lent_date), 'dd MMM yyyy')}</div>}
                   </div>
                   <button 
                    onClick={() => handleReturnToPossession(item)}
                    className="text-[9px] font-bold bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/20 hover:bg-accent/20 transition-all"
                   >
                    Received
                   </button>
                </div>
              ))}
              {lent.length === 0 && <div className="text-center py-8 text-muted-foreground/30 font-bold text-[9px]">No active lendings</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRetired = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('HOME')} className="p-3 bg-card rounded-xl border border-border/40 shadow-sm hover:bg-muted transition-all"><ArrowLeft size={18} /></button>
        <h2 className="text-2xl font-bold">Retired Archive</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['all', 'worn_out', 'gifted_out', 'lost', 'stolen', 'sold', 'returned'].map(r => (
          <button key={r} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-border/40 bg-card hover:bg-muted transition-all whitespace-nowrap">
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-card rounded-xl p-4 border border-border/40 shadow-sm opacity-70">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold">{item.name}</div>
                <div className="text-[10px] font-medium text-muted-foreground mt-1">Status: <span className="text-primary">{item.retired_reason?.replace('_', ' ')}</span></div>
                {item.retired_at && <div className="text-[9px] text-muted-foreground/60 mt-0.5">Retired on {format(new Date(item.retired_at), 'dd MMM yyyy')}</div>}
              </div>
              <Badge className="bg-muted text-muted-foreground">{item.retired_reason}</Badge>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-20 text-muted-foreground/20 font-bold text-xs">Archive empty</div>}
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('HOME')} className="p-3 bg-card rounded-xl border border-border/40 shadow-sm"><ArrowLeft size={18} /></button>
        <div className="bg-card rounded-2xl p-3 flex-1 border border-border/40 shadow-sm flex items-center gap-3">
          <Search size={18} className="text-accent" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search active inventory..." 
            className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button onClick={() => setSearchQuery("")}><X size={16} /></button>}
        </div>
      </div>
      
      {searchQuery && (
        <div className="space-y-2 mt-4">
          <div className="text-[10px] font-bold text-muted-foreground/50 ml-1">Search Results</div>
          {filteredSearchItems.map(item => (
            <div key={item.id} className="bg-card rounded-xl p-4 border border-border/40 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-muted/30 rounded-lg flex items-center justify-center text-accent shrink-0">
                <Search size={16} />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-sm font-bold truncate">{item.name}</div>
                <div className="text-[10px] font-medium text-muted-foreground flex gap-2">
                  <span>{item.status.replace('_', ' ')}</span>
                  {item.category && <span>• {item.category}</span>}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedItem(item); setView('HOME'); }}
                className="text-[9px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
              >
                View
              </button>
            </div>
          ))}
          {filteredSearchItems.length === 0 && (
            <div className="text-center py-20 text-muted-foreground/40 font-bold text-xs">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
      
      {!searchQuery && (
        <div className="text-center py-20 text-muted-foreground/20 font-bold text-xs">
          Type to search...
        </div>
      )}
    </div>
  );

  // --- Modals ---

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background p-4 md:p-6 pb-32 font-dm-sans selection:bg-accent/20">
      
      <PageHeader title="Inventory" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>

      {isLoading ? (
        <LoadingScreen message="Scanning node registers..." />
      ) : (
        <>
          {view === 'HOME' && renderHome()}
          {view === 'LOCATION' && renderLocation()}
          {view === 'PEOPLE' && renderPeople()}
          {view === 'RETIRED' && renderRetired()}
          {view === 'SEARCH' && renderSearch()}
        </>
      )}

      {/* --- Detail Overlay --- */}
      {selectedItem && !showRetireModal && !showLendModal && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-t-[40px] shadow-2xl border-t border-x border-border/40 p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground">Item Identity</div>
                <h2 className="text-3xl font-bold leading-none">{selectedItem.name}</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-3 bg-muted rounded-2xl"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <div className="text-[9px] font-bold text-muted-foreground/60 mb-2">Origin</div>
                <div className="flex items-center gap-2">
                  {selectedItem.origin_type === 'bought' ? <IndianRupee size={14} className="text-primary" /> : <Gift size={14} className="text-accent" />}
                  <span className="text-sm font-bold">{selectedItem.origin_type.replace('_', ' ')}</span>
                </div>
                {selectedItem.origin_person && <div className="text-[10px] font-bold text-muted-foreground mt-1">{selectedItem.origin_person}</div>}
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <div className="text-[9px] font-bold text-muted-foreground/60 mb-2">Condition</div>
                <Select 
                  value={selectedItem.condition} 
                  onChange={(e) => handleUpdateCondition(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 appearance-none cursor-pointer"
                >
                  {['new', 'good', 'fair', 'poor'].map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <div className="text-[10px] font-bold text-muted-foreground mt-1">Tap to change</div>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <div className="text-[9px] font-bold text-muted-foreground/60 mb-2">Notes</div>
                <div className="text-xs font-medium text-muted-foreground leading-relaxed italic">"{selectedItem.notes}"</div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setShowLendModal(true)}
                className="h-16 bg-accent text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
              >
                <Share2 size={20} />
                <span className="text-[9px] font-bold">Lend</span>
              </button>
              <button 
                onClick={() => {
                  setMovePath([]);
                  loadMoveFolder(null);
                  setShowMoveModal(true);
                }}
                className="h-16 bg-card border border-border/40 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm hover:bg-muted transition-all"
              >
                <Move size={20} className="text-muted-foreground" />
                <span className="text-[9px] font-bold">Move</span>
              </button>
              <button 
                onClick={() => setShowRetireModal(true)}
                className="h-16 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-rose-100 transition-all"
              >
                <Trash2 size={20} />
                <span className="text-[9px] font-bold">Retire</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Location Modal --- */}
      {showAddLocationModal && (
        <Modal title="Initialize Location" onClose={() => setShowAddLocationModal(false)}>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-bold text-muted-foreground/60 block mb-2">Name</label>
              <input 
                autoFocus
                type="text" 
                value={newLocName}
                onChange={e => setNewLocName(e.target.value)}
                placeholder="e.g. Bedroom"
                className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-bold text-muted-foreground/60 block mb-2">Icon</label>
                <Select 
                  value={newLocIcon} 
                  onChange={e => setNewLocIcon(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 appearance-none cursor-pointer"
                >
                  {['📦', '🏠', '🌆', '🛏️', '🗄️', '🚗', '🏢', '💼'].map(i => <option key={i} value={i}>{i}</option>)}
                </Select>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-bold text-muted-foreground/60 block mb-2">Type</label>
                <Select 
                  value={newLocType} 
                  onChange={e => setNewLocType(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 appearance-none cursor-pointer"
                >
                  {['other', 'city', 'building', 'room', 'furniture', 'compartment'].map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
            </div>
            <button 
              onClick={handleAddLocation}
              disabled={!newLocName}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* --- Add Item Modal --- */}
      {showAddItemModal && (
        <Modal title="Manifest Item" onClose={() => setShowAddItemModal(false)}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Item Name</label>
              <input 
                autoFocus
                type="text" 
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="e.g. Comb"
                className="w-full bg-transparent border-none p-0 text-lg font-black focus:ring-0"
              />
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-3">Origin Strategy</label>
              <div className="flex gap-2">
                {(['bought', 'gifted_in', 'borrowed'] as OriginType[]).map(o => (
                  <button 
                    key={o} 
                    onClick={() => setNewItemOrigin(o)}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${newItemOrigin === o ? 'bg-primary text-white border-primary shadow-lg' : 'bg-card border-border/40 text-muted-foreground'}`}
                  >
                    {o.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {newItemOrigin !== 'bought' && (
                <input 
                  type="text" 
                  placeholder={newItemOrigin === 'borrowed' ? "Borrowed from who?" : "Gifted by who?"}
                  value={newItemOriginPerson}
                  onChange={e => setNewItemOriginPerson(e.target.value)}
                  className="w-full bg-card border border-border/40 rounded-xl px-3 py-2 text-xs font-bold mt-3 focus:ring-1 focus:ring-accent outline-none"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Category</label>
                <input 
                  type="text" 
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                  placeholder="e.g. Toiletries"
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Value (₹)</label>
                <input 
                  type="number" 
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
            </div>
            <button 
              onClick={handleAddItem}
              disabled={!newItemName}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              Confirm manifest
            </button>
          </div>
        </Modal>
      )}

      {/* --- Retire Modal --- */}
      {showRetireModal && (
        <Modal title="Retire Asset" onClose={() => setShowRetireModal(false)}>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-3">Reason for retirement</label>
              <div className="grid grid-cols-2 gap-2">
                {(['worn_out', 'gifted_out', 'lost', 'stolen', 'sold', 'returned'] as RetiredReason[]).map(r => (
                  <button 
                    key={r} 
                    onClick={() => setRetireReason(r)}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${retireReason === r ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-card border-border/40 text-muted-foreground'}`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            {(retireReason === 'gifted_out' || retireReason === 'sold') && (
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">{retireReason === 'sold' ? 'Sold to' : 'Gifted to'}</label>
                <input 
                  type="text" 
                  value={retireToPerson}
                  onChange={e => setRetireToPerson(e.target.value)}
                  placeholder="Person's name"
                  className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
                />
              </div>
            )}
            <button 
              onClick={handleRetireItem}
              className="w-full h-14 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-900/20"
            >
              Confirm Retirement
            </button>
          </div>
        </Modal>
      )}

      {/* --- Lend Modal --- */}
      {showLendModal && (
        <Modal title="Lend to Person" onClose={() => setShowLendModal(false)}>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Recipient Name</label>
              <input 
                autoFocus
                type="text" 
                value={lendToPerson}
                onChange={e => setLendToPerson(e.target.value)}
                placeholder="Who has it?"
                className="w-full bg-transparent border-none p-0 text-lg font-black focus:ring-0"
              />
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Return Due Date (Optional)</label>
              <input 
                type="date" 
                value={lendDueDate}
                onChange={e => setLendDueDate(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
              />
            </div>
            <button 
              onClick={handleLendItem}
              disabled={!lendToPerson}
              className="w-full h-14 bg-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent/20"
            >
              Confirm Transfer
            </button>
          </div>
        </Modal>
      )}

      {/* --- Move Modal --- */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md p-6">
          <div className="bg-card w-full max-w-sm rounded-[32px] shadow-2xl border border-border/40 flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-8 pb-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">Move Item</h3>
                <button onClick={() => setShowMoveModal(false)} className="p-2 hover:bg-muted rounded-full transition-all"><X size={20} /></button>
              </div>
              
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
                <button 
                  onClick={() => { setMovePath([]); loadMoveFolder(null); }}
                  className={`text-[9px] font-black uppercase tracking-widest p-1.5 rounded-lg ${movePath.length === 0 ? 'text-primary bg-muted' : 'text-muted-foreground'}`}
                >
                  Root
                </button>
                {movePath.map((p, i) => (
                  <React.Fragment key={p.id}>
                    <ChevronRight size={12} className="text-muted-foreground/30" />
                    <button 
                      onClick={() => {
                        const idx = movePath.findIndex(x => x.id === p.id);
                        const newPath = movePath.slice(0, idx + 1);
                        setMovePath(newPath);
                        loadMoveFolder(p.id);
                      }}
                      className={`text-[9px] font-black uppercase tracking-widest p-1.5 rounded-lg ${i === movePath.length - 1 ? 'text-primary bg-muted' : 'text-muted-foreground'}`}
                    >
                      {p.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-2">
              <button 
                onClick={() => handleMoveConfirm(movePath.length > 0 ? movePath[movePath.length - 1].id : null)}
                className="w-full p-4 bg-muted/30 rounded-xl border border-border/40 text-left flex items-center justify-between group hover:bg-muted transition-all mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
                    <Check size={16} className="text-accent" />
                  </div>
                  <span className="text-xs font-black">Place Here</span>
                </div>
              </button>

              <div className="text-[9px] font-black text-muted-foreground/50 mb-3 ml-1">Sub-locations</div>
              {moveDestinations.map(loc => (
                <button 
                  key={loc.id}
                  onClick={() => {
                    setMovePath([...movePath, { id: loc.id, name: loc.name }]);
                    loadMoveFolder(loc.id);
                  }}
                  className="w-full p-4 bg-card rounded-xl border border-border/40 text-left flex items-center justify-between hover:border-accent/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{loc.icon || '📂'}</span>
                    <span className="text-xs font-black uppercase tracking-tight">{loc.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/20" />
                </button>
              ))}
              {moveDestinations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground/20 font-black uppercase text-[9px] tracking-widest">No sub-locations</div>
              )}
            </div>

            <div className="p-8 pt-4 border-t border-border/20">
              <button 
                onClick={() => handleMoveConfirm(movePath.length > 0 ? movePath[movePath.length - 1].id : null)}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                Move to {movePath.length > 0 ? movePath[movePath.length - 1].name : 'Root'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
