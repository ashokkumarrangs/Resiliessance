"use client";
import { Select } from "@/components/Select";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, ArrowRightLeft, Check, ChevronRight, Gift, History, Home, 
  IndianRupee, Move, Package, Plus, PlusCircle, Search, Share2, Trash2, 
  Users, X, ShieldAlert, Wrench, Heart, ExternalLink, Save, Calendar, Clock, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { useDialog } from "@/components/dialog-provider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { format } from "date-fns";

// --- Types ---

type OriginType = 'bought' | 'gifted_in' | 'borrowed';
type ItemStatus = 'active' | 'lent_out' | 'retired';
type RetiredReason = 'worn_out' | 'gifted_out' | 'lost' | 'stolen' | 'sold' | 'returned';
type ViewMode = 'HOME' | 'LOCATION' | 'PEOPLE' | 'RETIRED' | 'SEARCH' | 'WISHLIST' | 'WARRANTIES' | 'MAINTENANCE';

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

  // Warranty extensions
  warranty_provider?: string | null;
  serial_number?: string | null;
  model_number?: string | null;
  warranty_duration_months?: number | null;
  warranty_expiry_date?: string | null;
  enable_warranty_alerts?: boolean;
  warranty_alert_days_before?: number[] | null;
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
  const { confirm } = useDialog();
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

  // Wishlist State
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [savingsAllocations, setSavingsAllocations] = useState<any[]>([]);
  const [showAddWishlistModal, setShowAddWishlistModal] = useState(false);
  const [wishlistToAcquire, setWishlistToAcquire] = useState<any | null>(null);

  // Maintenance State
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [globalMaintenanceSchedules, setGlobalMaintenanceSchedules] = useState<any[]>([]);

  // Item Overlay Sub-Tab State
  const [selectedSubTab, setSelectedSubTab] = useState<'details' | 'warranty' | 'maintenance'>('details');

  // Form States for Wishlist
  const [wishName, setWishName] = useState("");
  const [wishPrice, setWishPrice] = useState("");
  const [wishPriority, setWishPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [wishUrl, setWishUrl] = useState("");
  const [wishLocationId, setWishLocationId] = useState("");
  const [wishSavingsGoalId, setWishSavingsGoalId] = useState("");
  const [wishNotes, setWishNotes] = useState("");

  // Acquire form states
  const [acquireLocationId, setAcquireLocationId] = useState("");
  const [acquireCondition, setAcquireCondition] = useState("new");
  const [acquirePrice, setAcquirePrice] = useState("");
  const [completeSavingsGoal, setCompleteSavingsGoal] = useState(true);

  // Form States for Warranty
  const [editWarrantyProvider, setEditWarrantyProvider] = useState("");
  const [editSerialNumber, setEditSerialNumber] = useState("");
  const [editModelNumber, setEditModelNumber] = useState("");
  const [editWarrantyDuration, setEditWarrantyDuration] = useState("");
  const [editWarrantyExpiry, setEditWarrantyExpiry] = useState("");
  const [editEnableAlerts, setEditEnableAlerts] = useState(true);

  // Form States for Maintenance
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [maintTaskName, setMaintTaskName] = useState("");
  const [maintFreqValue, setMaintFreqValue] = useState("1");
  const [maintFreqUnit, setMaintFreqUnit] = useState("months");
  const [maintNotes, setMaintNotes] = useState("");
  const [maintLastPerformed, setMaintLastPerformed] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Log completion form states
  const [showLogMaintModal, setShowLogMaintModal] = useState<any | null>(null);
  const [logMaintNotes, setLogMaintNotes] = useState("");
  const [logMaintCost, setLogMaintCost] = useState("");
  const [logMaintDate, setLogMaintDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
  const [newItemDate, setNewItemDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newItemTime, setNewItemTime] = useState(format(new Date(), 'HH:mm'));

  const [retireReason, setRetireReason] = useState<RetiredReason>('worn_out');
  const [retireToPerson, setRetireToPerson] = useState("");
  const [retireTime, setRetireTime] = useState(format(new Date(), 'HH:mm'));
  
  const [lendToPerson, setLendToPerson] = useState("");
  const [lendDueDate, setLendDueDate] = useState("");
  const [lendTime, setLendTime] = useState(format(new Date(), 'HH:mm'));

  // --- Data Fetching ---

  useEffect(() => {
    fetchData();
  }, [view, currentLocationId, showAllNested]);

  // Fetch item maintenance schedules and logs
  useEffect(() => {
    if (selectedItem) {
      fetchItemMaintenance(selectedItem.id);
      setEditWarrantyProvider(selectedItem.warranty_provider || "");
      setEditSerialNumber(selectedItem.serial_number || "");
      setEditModelNumber(selectedItem.model_number || "");
      setEditWarrantyDuration(selectedItem.warranty_duration_months ? String(selectedItem.warranty_duration_months) : "");
      setEditWarrantyExpiry(selectedItem.warranty_expiry_date || "");
      setEditEnableAlerts(selectedItem.enable_warranty_alerts !== false);
      setSelectedSubTab('details'); // Reset sub tab
    }
  }, [selectedItem]);

  const fetchItemMaintenance = async (itemId: string) => {
    try {
      const { data: schedules, error: schedError } = await supabase
        .from('asset_maintenance_schedules')
        .select('*')
        .eq('item_id', itemId)
        .order('next_due_at', { ascending: true });
      if (schedError) throw schedError;
      setMaintenanceSchedules(schedules || []);

      const { data: logs, error: logError } = await supabase
        .from('asset_maintenance_logs')
        .select('*')
        .eq('item_id', itemId)
        .order('performed_at', { ascending: false });
      if (logError) throw logError;
      setMaintenanceLogs(logs || []);
    } catch (e: any) {
      console.error("Failed to fetch maintenance details", e);
    }
  };

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
      else if (view === 'WISHLIST') {
        const { data: wishData, error: wishError } = await supabase
          .from('inventory_wishlist')
          .select('*')
          .order('created_at', { ascending: false });
        if (wishError) throw wishError;
        setWishlist(wishData || []);

        const { data: goalsData } = await supabase
          .from('savings_goals')
          .select('*')
          .eq('status', 'active');
        setSavingsGoals(goalsData || []);

        const { data: allocData } = await supabase
          .from('savings_allocations')
          .select('*');
        setSavingsAllocations(allocData || []);

        const { data: allLocs } = await supabase
          .from('inventory_locations')
          .select('*')
          .order('name');
        setLocations(allLocs || []);
      }
      else if (view === 'WARRANTIES') {
        const { data: warItems, error: warError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('status', 'active')
          .not('warranty_expiry_date', 'is', null)
          .order('warranty_expiry_date', { ascending: true });
        if (warError) throw warError;
        setItems(warItems || []);
      }
      else if (view === 'MAINTENANCE') {
        const { data: schedData, error: schedError } = await supabase
          .from('asset_maintenance_schedules')
          .select('*, inventory_items(name, status)')
          .order('next_due_at', { ascending: true });
        if (schedError) throw schedError;
        const activeScheds = (schedData || []).filter((s: any) => s.inventory_items?.status === 'active');
        setGlobalMaintenanceSchedules(activeScheds);
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
    } catch (e: any) {
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
    const confirmed = await confirm("Are you sure? This will delete this location and all its sub-folders. Items will be un-categorized.");
    if (!confirmed) return;
    
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
        status: 'active',
        acquired_date: newItemDate,
        acquired_time: newItemTime
      });
      if (error) throw error;
      toast.success("Item added");
      setShowAddItemModal(false);
      setNewItemName("");
      setNewItemOrigin('bought');
      setNewItemOriginPerson("");
      setNewItemPrice("");
      setNewItemCategory("");
      setNewItemNotes("");
      setNewItemDate(format(new Date(), 'yyyy-MM-dd'));
      setNewItemTime(format(new Date(), 'HH:mm'));
      fetchData();
    } catch (e: any) { 
      console.error(e);
      toast.error(e.message || "Failed to add item"); 
    }
  };

  const handleRetireItem = async () => {
    if (!selectedItem) return;
    try {
      const combinedDateTime = `${format(new Date(), 'yyyy-MM-dd')}T${retireTime}:00`;
      const { error } = await supabase.from('inventory_items').update({
        status: 'retired',
        retired_reason: retireReason,
        retired_at: new Date(combinedDateTime).toISOString(),
        retired_to_person: retireToPerson || null
      }).eq('id', selectedItem.id);
      if (error) throw error;
      toast.success(`Item retired: ${retireReason.replace('_', ' ')}`);
      setShowRetireModal(false);
      setSelectedItem(null);
      setRetireTime(format(new Date(), 'HH:mm'));
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
        lent_date: new Date().toLocaleDateString('en-CA'),
        lent_time: lendTime,
        return_due_date: lendDueDate || null
      }).eq('id', selectedItem.id);
      if (error) throw error;
      toast.success(`Lent to ${lendToPerson}`);
      setShowLendModal(false);
      setSelectedItem(null);
      setLendTime(format(new Date(), 'HH:mm'));
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

  const handleSaveWarranty = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        warranty_provider: editWarrantyProvider || null,
        serial_number: editSerialNumber || null,
        model_number: editModelNumber || null,
        warranty_duration_months: editWarrantyDuration ? parseInt(editWarrantyDuration) : null,
        warranty_expiry_date: editWarrantyExpiry || null,
        enable_warranty_alerts: editEnableAlerts
      };

      const { error } = await supabase
        .from('inventory_items')
        .update(payload)
        .eq('id', selectedItem.id);

      if (error) throw error;
      toast.success("Warranty details updated successfully");
      setSelectedItem({ ...selectedItem, ...payload });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update warranty");
    }
  };

  const handleAddMaintenanceSchedule = async () => {
    if (!selectedItem || !maintTaskName.trim()) return;
    try {
      const val = parseInt(maintFreqValue);
      const lastPerfDate = new Date(maintLastPerformed);
      const nextDue = new Date(lastPerfDate);
      if (maintFreqUnit === 'days') {
        nextDue.setDate(nextDue.getDate() + val);
      } else if (maintFreqUnit === 'weeks') {
        nextDue.setDate(nextDue.getDate() + val * 7);
      } else if (maintFreqUnit === 'months') {
        nextDue.setMonth(nextDue.getMonth() + val);
      } else if (maintFreqUnit === 'years') {
        nextDue.setFullYear(nextDue.getFullYear() + val);
      }

      const payload = {
        item_id: selectedItem.id,
        task_name: maintTaskName,
        frequency_value: val,
        frequency_unit: maintFreqUnit,
        last_performed_at: new Date(maintLastPerformed).toISOString(),
        next_due_at: nextDue.toISOString(),
        notes: maintNotes || null
      };

      const { error } = await supabase
        .from('asset_maintenance_schedules')
        .insert(payload);

      if (error) throw error;
      toast.success("Maintenance schedule added");
      setShowAddScheduleModal(false);
      setMaintTaskName("");
      setMaintNotes("");
      fetchItemMaintenance(selectedItem.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to add schedule");
    }
  };

  const handleLogMaintenanceCompletion = async () => {
    if (!showLogMaintModal || !selectedItem) return;
    try {
      const schedule = showLogMaintModal;
      const logPayload = {
        schedule_id: schedule.id,
        item_id: selectedItem.id,
        performed_at: new Date(logMaintDate).toISOString(),
        notes: logMaintNotes || null,
        cost: logMaintCost ? parseFloat(logMaintCost) : 0.00
      };

      const { error: logError } = await supabase
        .from('asset_maintenance_logs')
        .insert(logPayload);

      if (logError) throw logError;

      const val = schedule.frequency_value;
      const perfDate = new Date(logMaintDate);
      const nextDue = new Date(perfDate);
      if (schedule.frequency_unit === 'days') {
        nextDue.setDate(nextDue.getDate() + val);
      } else if (schedule.frequency_unit === 'weeks') {
        nextDue.setDate(nextDue.getDate() + val * 7);
      } else if (schedule.frequency_unit === 'months') {
        nextDue.setMonth(nextDue.getMonth() + val);
      } else if (schedule.frequency_unit === 'years') {
        nextDue.setFullYear(nextDue.getFullYear() + val);
      }

      const { error: schedError } = await supabase
        .from('asset_maintenance_schedules')
        .update({
          last_performed_at: new Date(logMaintDate).toISOString(),
          next_due_at: nextDue.toISOString()
        })
        .eq('id', schedule.id);

      if (schedError) throw schedError;

      toast.success("Maintenance logged successfully");
      setShowLogMaintModal(null);
      setLogMaintNotes("");
      setLogMaintCost("");
      fetchItemMaintenance(selectedItem.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to log maintenance");
    }
  };

  const handleDeleteMaintenanceSchedule = async (scheduleId: string) => {
    const confirmed = await confirm("Delete this maintenance schedule?");
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from('asset_maintenance_schedules')
        .delete()
        .eq('id', scheduleId);
      if (error) throw error;
      toast.success("Schedule deleted");
      if (selectedItem) fetchItemMaintenance(selectedItem.id);
    } catch (e: any) {
      toast.error("Failed to delete schedule");
    }
  };

  const handleAddWishlist = async () => {
    if (!wishName.trim()) return;
    try {
      const payload = {
        name: wishName,
        estimated_price: wishPrice ? parseFloat(wishPrice) : 0.00,
        priority: wishPriority,
        buy_url: wishUrl || null,
        location_id: wishLocationId || null,
        savings_goal_id: wishSavingsGoalId || null,
        notes: wishNotes || null
      };

      const { error } = await supabase
        .from('inventory_wishlist')
        .insert(payload);

      if (error) throw error;
      toast.success("Added to Wishlist");
      setShowAddWishlistModal(false);
      setWishName("");
      setWishPrice("");
      setWishPriority("medium");
      setWishUrl("");
      setWishLocationId("");
      setWishSavingsGoalId("");
      setWishNotes("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to add wishlist item");
    }
  };

  const handleAcquireWishlist = async () => {
    if (!wishlistToAcquire) return;
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .insert({
          name: wishlistToAcquire.name,
          location_id: acquireLocationId || null,
          purchase_price: acquirePrice ? parseFloat(acquirePrice) : (wishlistToAcquire.estimated_price || null),
          condition: acquireCondition,
          status: 'active',
          origin_type: 'bought',
          acquired_date: format(new Date(), 'yyyy-MM-dd')
        })
        .select()
        .single();

      if (itemError) throw itemError;

      const { error: delError } = await supabase
        .from('inventory_wishlist')
        .delete()
        .eq('id', wishlistToAcquire.id);

      if (delError) throw delError;

      if (completeSavingsGoal && wishlistToAcquire.savings_goal_id) {
        const { error: goalError } = await supabase
          .from('savings_goals')
          .update({ status: 'completed' })
          .eq('id', wishlistToAcquire.savings_goal_id);
        if (goalError) console.error("Failed to complete savings goal:", goalError);
      }

      toast.success(`Successfully promoted ${wishlistToAcquire.name} to active inventory!`);
      setWishlistToAcquire(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Acquire failed");
    }
  };

  const handleDeleteWishlistItem = async (id: string) => {
    const confirmed = await confirm("Remove this item from your wishlist?");
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from('inventory_wishlist')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Removed from wishlist");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to delete wishlist item");
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

      <div className="grid grid-cols-2 gap-3 pt-4">
        <button 
          onClick={() => setView('PEOPLE')}
          className="bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all"
        >
          <Users size={18} className="text-accent" />
          <span className="text-xs font-black">People</span>
        </button>
        <button 
          onClick={() => setView('RETIRED')}
          className="bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all"
        >
          <History size={18} className="text-primary" />
          <span className="text-xs font-black">Retired Logs</span>
        </button>
        <button 
          onClick={() => setView('WISHLIST')}
          className="bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all hover:border-pink-200 group"
        >
          <Heart size={18} className="text-pink-500 fill-pink-500/10 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black">Wishlist</span>
        </button>
        <button 
          onClick={() => setView('WARRANTIES')}
          className="bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all hover:border-emerald-200 group"
        >
          <ShieldAlert size={18} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black">Warranties</span>
        </button>
        <button 
          onClick={() => setView('MAINTENANCE')}
          className="col-span-2 bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-center gap-2 shadow-sm hover:bg-muted transition-all hover:border-blue-200 group"
        >
          <Wrench size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black">Asset Maintenance Upkeep</span>
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

  const renderWishlist = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/10 mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('HOME')} className="p-3 bg-card rounded-xl border border-border/40 shadow-sm hover:bg-muted transition-all"><ArrowLeft size={18} /></button>
            <div>
              <h2 className="text-2xl font-black">Aspirational Wishlist</h2>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Future Purchases & Savings Goals</div>
            </div>
          </div>
          <button 
            onClick={() => setShowAddWishlistModal(true)}
            className="h-11 px-4 bg-pink-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 hover:bg-pink-600 font-bold text-xs transition-all"
          >
            <Plus size={16} />
            Add Wish
          </button>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlist.map(item => {
            const goal = savingsGoals.find(g => g.id === item.savings_goal_id);
            let savedAmt = 0;
            let targetAmt = goal?.target_amount || 0;
            let pct = 0;
            if (goal) {
              const allocs = savingsAllocations.filter(a => a.goal_id === goal.id);
              savedAmt = allocs.reduce((sum, a) => sum + (parseFloat(a.allocated_amount) || 0), 0);
              pct = targetAmt > 0 ? Math.min(100, Math.round((savedAmt / targetAmt) * 100)) : 0;
            }

            return (
              <div 
                key={item.id} 
                className="bg-card border-2 border-dashed border-border/40 hover:border-pink-500/40 rounded-3xl p-6 transition-all hover:shadow-zenith flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black truncate max-w-[200px]">{item.name}</h3>
                      {item.estimated_price > 0 && (
                        <div className="text-sm font-black text-foreground mt-0.5">
                          Est: ₹{parseFloat(item.estimated_price).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider
                        ${item.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                          item.priority === 'low' ? 'bg-slate-50 text-slate-600 border-slate-200' : 
                          'bg-blue-50 text-blue-600 border-blue-200'}`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-muted-foreground italic leading-relaxed">
                      "{item.notes}"
                    </div>
                  )}

                  {/* Savings goal progress bar */}
                  {goal && (
                    <div className="bg-muted/30 p-3 rounded-2xl border border-border/20 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span className="truncate max-w-[150px]">Goal: {goal.name}</span>
                        <span>{pct}% Saved</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground/60 font-bold">
                        <span>₹{savedAmt.toLocaleString('en-IN')} saved</span>
                        <span>Target: ₹{targetAmt.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-border/10 pt-4 mt-4">
                  <button 
                    onClick={() => {
                      setWishlistToAcquire(item);
                      setAcquireLocationId(item.location_id || "");
                      setAcquireCondition("new");
                      setAcquirePrice(item.estimated_price ? String(item.estimated_price) : "");
                      setCompleteSavingsGoal(true);
                    }}
                    className="flex-1 h-10 bg-pink-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10 hover:bg-pink-600 transition-all"
                  >
                    <Sparkles size={14} /> Promote (Acquire)
                  </button>
                  {item.buy_url && (
                    <a 
                      href={item.buy_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 border border-border/40 hover:border-pink-300 rounded-xl text-muted-foreground hover:text-pink-500 flex items-center justify-center bg-card hover:bg-muted/50 transition-all"
                      title="Buy URL Link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button 
                    onClick={() => handleDeleteWishlistItem(item.id)}
                    className="p-2 border border-border/40 hover:border-rose-200 rounded-xl text-muted-foreground hover:text-rose-500 flex items-center justify-center bg-card hover:bg-rose-50 transition-all"
                    title="Delete Wish"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {wishlist.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-24 border-2 border-dashed border-muted/50 rounded-[32px] text-muted-foreground/40 font-bold text-sm bg-muted/5">
              Your wishlist is currently empty.<br />Add items you plan to acquire in the future!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWarranties = () => {
    const criticalExpiries = items.filter(i => {
      if (!i.warranty_expiry_date) return false;
      const days = Math.ceil((new Date(i.warranty_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 30;
    });

    const activeWarranties = items.filter(i => {
      if (!i.warranty_expiry_date) return false;
      const days = Math.ceil((new Date(i.warranty_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    });

    const expiredWarranties = items.filter(i => {
      if (!i.warranty_expiry_date) return false;
      const days = Math.ceil((new Date(i.warranty_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days <= 0;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 pb-2 border-b border-border/10 mb-4">
          <button onClick={() => setView('HOME')} className="p-3 bg-card rounded-xl border border-border/40 shadow-sm hover:bg-muted transition-all"><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-2xl font-black">Warranty Coverage Registry</h2>
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Manufacturer & Extended Protection Plans</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/40 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-emerald-500">{activeWarranties.length + criticalExpiries.length}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Active</div>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-amber-500 animate-pulse">{criticalExpiries.length}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Under 30 Days</div>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-slate-400">{expiredWarranties.length}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Expired</div>
          </div>
        </div>

        {/* Listing Sections */}
        <div className="space-y-6">
          {/* Critical Warnings */}
          {criticalExpiries.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block ml-1">Expires Soon (Critical)</span>
              <div className="space-y-2">
                {criticalExpiries.map(i => {
                  const days = Math.ceil((new Date(i.warranty_expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={i.id} 
                      onClick={() => { setSelectedItem(i); setSelectedSubTab('warranty'); }}
                      className="bg-card border border-rose-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-rose-50/20 transition-all hover:scale-[1.01]"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-black uppercase text-foreground">{i.name}</div>
                        <div className="text-[9px] font-bold text-muted-foreground">
                          Provider: {i.warranty_provider || 'Unknown'} • SN: {i.serial_number || 'N/A'}
                        </div>
                      </div>
                      <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                        {days} Days Left
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Warranties */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block ml-1">Active Warranties</span>
            <div className="space-y-2">
              {activeWarranties.map(i => {
                const days = Math.ceil((new Date(i.warranty_expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div 
                    key={i.id} 
                    onClick={() => { setSelectedItem(i); setSelectedSubTab('warranty'); }}
                    className="bg-card border border-border/40 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-emerald-300 transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase text-foreground">{i.name}</div>
                      <div className="text-[9px] font-bold text-muted-foreground">
                        Provider: {i.warranty_provider || 'Unknown'} • SN: {i.serial_number || 'N/A'}
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {days} Days Left
                    </span>
                  </div>
                );
              })}
              {activeWarranties.length === 0 && criticalExpiries.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border/40 rounded-2xl text-[10px] font-bold text-muted-foreground/40 bg-muted/5">
                  No active warranties found
                </div>
              )}
            </div>
          </div>

          {/* Expired Warranties */}
          {expiredWarranties.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Expired Warranties</span>
              <div className="space-y-2">
                {expiredWarranties.map(i => (
                  <div 
                    key={i.id} 
                    onClick={() => { setSelectedItem(i); setSelectedSubTab('warranty'); }}
                    className="bg-card border border-border/40 opacity-60 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:opacity-100 transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase text-foreground">{i.name}</div>
                      <div className="text-[9px] font-bold text-muted-foreground">
                        Provider: {i.warranty_provider || 'Unknown'} • Expired: {format(new Date(i.warranty_expiry_date!), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200">
                      Expired
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMaintenance = () => {
    const overdueTasks = globalMaintenanceSchedules.filter(s => new Date(s.next_due_at) < new Date());
    const upcomingTasks = globalMaintenanceSchedules.filter(s => {
      const nextDate = new Date(s.next_due_at);
      return nextDate >= new Date() && (nextDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000;
    });
    const stableTasks = globalMaintenanceSchedules.filter(s => {
      const nextDate = new Date(s.next_due_at);
      return nextDate >= new Date() && (nextDate.getTime() - new Date().getTime()) >= 7 * 24 * 60 * 60 * 1000;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 pb-2 border-b border-border/10 mb-4">
          <button onClick={() => setView('HOME')} className="p-3 bg-card rounded-xl border border-border/40 shadow-sm hover:bg-muted transition-all"><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-2xl font-black">Upkeep & Maintenance Hub</h2>
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Asset Performance Interval Alerts</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/40 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-rose-500 animate-pulse">{overdueTasks.length}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Overdue</div>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-amber-500">{upcomingTasks.length}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Due Soon</div>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-emerald-500">{stableTasks.length}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Upkeep OK</div>
          </div>
        </div>

        {/* Listing Sections */}
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block ml-1">Overdue Tasks</span>
              <div className="space-y-2">
                {overdueTasks.map(sched => (
                  <div 
                    key={sched.id}
                    onClick={async () => {
                      const { data: itemData } = await supabase.from('inventory_items').select('*').eq('id', sched.item_id).single();
                      if (itemData) {
                        setSelectedItem(itemData);
                        setSelectedSubTab('maintenance');
                      }
                    }}
                    className="bg-card border border-rose-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-rose-50/20 transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase text-foreground">{sched.task_name}</div>
                      <div className="text-[9px] font-bold text-muted-foreground">
                        Asset: <span className="text-primary font-black uppercase">{sched.inventory_items?.name || 'Unknown'}</span> • Overdue: {format(new Date(sched.next_due_at), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-rose-500 text-white px-2.5 py-1 rounded-lg animate-bounce">
                      Log Completion
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Section */}
          {upcomingTasks.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block ml-1">Due in Next 7 Days</span>
              <div className="space-y-2">
                {upcomingTasks.map(sched => (
                  <div 
                    key={sched.id}
                    onClick={async () => {
                      const { data: itemData } = await supabase.from('inventory_items').select('*').eq('id', sched.item_id).single();
                      if (itemData) {
                        setSelectedItem(itemData);
                        setSelectedSubTab('maintenance');
                      }
                    }}
                    className="bg-card border border-border/40 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-amber-300 transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase text-foreground">{sched.task_name}</div>
                      <div className="text-[9px] font-bold text-muted-foreground">
                        Asset: <span className="text-primary font-black uppercase">{sched.inventory_items?.name || 'Unknown'}</span> • Due: {format(new Date(sched.next_due_at), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-200">
                      Due Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upkeep OK Section */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block ml-1">Stable Tasks</span>
            <div className="space-y-2">
              {stableTasks.map(sched => (
                <div 
                  key={sched.id}
                  onClick={async () => {
                    const { data: itemData } = await supabase.from('inventory_items').select('*').eq('id', sched.item_id).single();
                    if (itemData) {
                      setSelectedItem(itemData);
                      setSelectedSubTab('maintenance');
                    }
                  }}
                  className="bg-card border border-border/40 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-emerald-300 transition-all hover:scale-[1.01]"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase text-foreground">{sched.task_name}</div>
                    <div className="text-[9px] font-bold text-muted-foreground">
                      Asset: <span className="text-primary font-black uppercase">{sched.inventory_items?.name || 'Unknown'}</span> • Next due: {format(new Date(sched.next_due_at), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Active
                  </span>
                </div>
              ))}
              {globalMaintenanceSchedules.length === 0 && (
                <div className="text-center py-20 border border-dashed border-border/40 rounded-[32px] text-[10px] font-bold text-muted-foreground/40 bg-muted/5">
                  No active recurring tasks in upkeep system.<br />Navigate to any item details to configure maintenance schedules!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Modals ---

  return (
    <PageWrapper
      title="Inventory"
      reportHref="/reports"
      className="pb-32 selection:bg-accent/20"
    >

      {isLoading ? (
        <LoadingScreen message="Scanning node registers..." />
      ) : (
        <>
          {view === 'HOME' && renderHome()}
          {view === 'LOCATION' && renderLocation()}
          {view === 'PEOPLE' && renderPeople()}
          {view === 'RETIRED' && renderRetired()}
          {view === 'SEARCH' && renderSearch()}
          {view === 'WISHLIST' && renderWishlist()}
          {view === 'WARRANTIES' && renderWarranties()}
          {view === 'MAINTENANCE' && renderMaintenance()}
        </>
      )}

      {/* --- Detail Overlay --- */}
      {selectedItem && !showRetireModal && !showLendModal && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-t-[40px] shadow-2xl border-t border-x border-border/40 p-8 space-y-6 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Asset Workspace</div>
                <h2 className="text-2xl font-bold leading-none truncate max-w-[280px]">{selectedItem.name}</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-3 bg-muted hover:bg-muted/80 rounded-2xl transition-all"><X size={20} /></button>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="flex border-b border-border/10">
              {(['details', 'warranty', 'maintenance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedSubTab(tab)}
                  className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${selectedSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground/50 hover:text-foreground'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sub Tabs Content Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-1">
              
              {/* DETAILS SUB TAB */}
              {selectedSubTab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                      <div className="text-[9px] font-bold text-muted-foreground/60 mb-2">Origin</div>
                      <div className="flex items-center gap-2">
                        {selectedItem.origin_type === 'bought' ? <IndianRupee size={14} className="text-primary" /> : <Gift size={14} className="text-accent" />}
                        <span className="text-sm font-bold uppercase">{selectedItem.origin_type.replace('_', ' ')}</span>
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

                  <div className="grid grid-cols-3 gap-3 pt-2">
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
              )}

              {/* WARRANTY SUB TAB */}
              {selectedSubTab === 'warranty' && (
                <div className="space-y-4">
                  {/* Warranty Expiry Indicator */}
                  {selectedItem.warranty_expiry_date ? (() => {
                    const daysLeft = Math.ceil((new Date(selectedItem.warranty_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isActive = daysLeft > 0;
                    return (
                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${isActive ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={18} className={isActive ? 'text-emerald-500' : 'text-rose-500'} />
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider">{isActive ? 'Active Coverage' : 'Coverage Expired'}</div>
                            <div className="text-[10px] opacity-80 font-medium">
                              {isActive ? `${daysLeft} days remaining` : `Expired on ${format(new Date(selectedItem.warranty_expiry_date), 'dd MMM yyyy')}`}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <div className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md">
                            OK
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="p-4 rounded-2xl border border-dashed border-border/40 text-center text-muted-foreground/60 text-xs font-bold bg-muted/10">
                      No warranty details registered
                    </div>
                  )}

                  {/* Warranty Inputs */}
                  <div className="space-y-3 bg-muted/10 p-4 rounded-2xl border border-border/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-muted-foreground/60 block mb-1">PROVIDER</label>
                        <input 
                          type="text"
                          value={editWarrantyProvider}
                          onChange={e => setEditWarrantyProvider(e.target.value)}
                          placeholder="e.g. AppleCare+"
                          className="w-full bg-card border border-border/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-muted-foreground/60 block mb-1">EXPIRY DATE</label>
                        <input 
                          type="date"
                          value={editWarrantyExpiry}
                          onChange={e => setEditWarrantyExpiry(e.target.value)}
                          className="w-full bg-card border border-border/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-muted-foreground/60 block mb-1">SERIAL NUMBER</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={editSerialNumber}
                            onChange={e => setEditSerialNumber(e.target.value)}
                            placeholder="SN..."
                            className="w-full bg-card border border-border/40 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary font-mono"
                          />
                          {editSerialNumber && (
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(editSerialNumber);
                                toast.success("Serial Number copied!");
                              }}
                              className="absolute right-2 top-2 text-muted-foreground/60 hover:text-primary"
                              title="Copy to Clipboard"
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-muted-foreground/60 block mb-1">MODEL NUMBER</label>
                        <input 
                          type="text"
                          value={editModelNumber}
                          onChange={e => setEditModelNumber(e.target.value)}
                          placeholder="Model..."
                          className="w-full bg-card border border-border/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-muted-foreground/60 block mb-1">DURATION (MONTHS)</label>
                        <input 
                          type="number"
                          value={editWarrantyDuration}
                          onChange={e => setEditWarrantyDuration(e.target.value)}
                          placeholder="24"
                          className="w-full bg-card border border-border/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer py-2">
                          <input 
                            type="checkbox" 
                            checked={editEnableAlerts} 
                            onChange={e => setEditEnableAlerts(e.target.checked)}
                            className="rounded border-border/40 accent-primary" 
                          />
                          <span>Enable Expiry Alerts</span>
                        </label>
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveWarranty}
                      className="w-full h-11 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-all mt-2"
                    >
                      <Save size={14} />
                      Save Coverage Details
                    </button>
                  </div>
                </div>
              )}

              {/* MAINTENANCE SUB TAB */}
              {selectedSubTab === 'maintenance' && (
                <div className="space-y-4">
                  {/* Maintenance Header */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase">Recurring Upkeeps</span>
                    <button 
                      onClick={() => setShowAddScheduleModal(true)}
                      className="flex items-center gap-1 text-[10px] font-black text-primary border border-primary/20 px-2.5 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      <Plus size={12} /> Add Upkeep Task
                    </button>
                  </div>

                  {/* Schedules List */}
                  <div className="space-y-2">
                    {maintenanceSchedules.map(sched => {
                      const nextDate = new Date(sched.next_due_at);
                      const isOverdue = nextDate < new Date();
                      const isSoon = !isOverdue && (nextDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000;
                      
                      return (
                        <div key={sched.id} className="bg-card border border-border/40 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-black uppercase tracking-tight text-foreground">{sched.task_name}</div>
                              <div className="text-[9px] font-bold text-muted-foreground mt-0.5">
                                Interval: Every {sched.frequency_value} {sched.frequency_unit}
                              </div>
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${isOverdue ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : isSoon ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                              {isOverdue ? 'OVERDUE' : isSoon ? 'DUE SOON' : 'UPKEEP OK'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] border-t border-border/10 pt-2 text-muted-foreground">
                            <div>
                              Next due: <span className={`font-black ${isOverdue ? 'text-rose-500' : 'text-foreground'}`}>{format(nextDate, 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setShowLogMaintModal(sched);
                                  setLogMaintNotes("");
                                  setLogMaintCost("");
                                  setLogMaintDate(format(new Date(), 'yyyy-MM-dd'));
                                }}
                                className="flex items-center gap-1 text-[9px] font-black bg-blue-500 text-white px-2.5 py-1 rounded-lg hover:bg-blue-600 transition-all shadow-sm shadow-blue-500/10"
                                title="Mark Completed"
                              >
                                <Wrench size={10} /> Mark Done
                              </button>
                              <button 
                                onClick={() => handleDeleteMaintenanceSchedule(sched.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all border border-border/30 hover:border-rose-200"
                                title="Delete Task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {maintenanceSchedules.length === 0 && (
                      <div className="p-6 text-center border border-dashed border-border/40 rounded-2xl text-[10px] font-bold text-muted-foreground/40 bg-muted/5">
                        No recurring upkeep registered for this item
                      </div>
                    )}
                  </div>

                  {/* Logs / History List */}
                  {maintenanceLogs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase block">Upkeep History</span>
                      <div className="bg-muted/10 border border-border/20 rounded-2xl p-4 space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                        {maintenanceLogs.map(log => (
                          <div key={log.id} className="text-[10px] flex justify-between items-start border-b border-border/10 last:border-0 pb-2 last:pb-0">
                            <div>
                              <div className="font-bold text-foreground">{format(new Date(log.performed_at), 'dd MMM yyyy')}</div>
                              {log.notes && <div className="text-[9px] text-muted-foreground italic mt-0.5">"{log.notes}"</div>}
                            </div>
                            {parseFloat(log.cost) > 0 && (
                              <span className="font-black text-emerald-600">₹{parseFloat(log.cost).toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Acquired Date</label>
                <input 
                  type="date" 
                  value={newItemDate}
                  onChange={e => setNewItemDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Acquired Time</label>
                <input 
                  type="time" 
                  value={newItemTime}
                  onChange={e => setNewItemTime(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
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
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Time of retirement</label>
              <input 
                type="time" 
                value={retireTime}
                onChange={e => setRetireTime(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
              />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Lent Time</label>
                <input 
                  type="time" 
                  value={lendTime}
                  onChange={e => setLendTime(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Return Due Date</label>
                <input 
                  type="date" 
                  value={lendDueDate}
                  onChange={e => setLendDueDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
                />
              </div>
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
      {/* --- Add Wishlist Item Modal --- */}
      {showAddWishlistModal && (
        <Modal title="Add to Wishlist" onClose={() => setShowAddWishlistModal(false)}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Item Name</label>
              <input 
                autoFocus
                type="text" 
                value={wishName}
                onChange={e => setWishName(e.target.value)}
                placeholder="e.g. Robot Vacuum"
                className="w-full bg-transparent border-none p-0 text-lg font-black focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Est. Price (₹)</label>
                <input 
                  type="number" 
                  value={wishPrice}
                  onChange={e => setWishPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Priority</label>
                <Select 
                  value={wishPriority} 
                  onChange={e => setWishPriority(e.target.value as any)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Buy URL Link</label>
              <input 
                type="text" 
                value={wishUrl}
                onChange={e => setWishUrl(e.target.value)}
                placeholder="https://amazon.in/..."
                className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Target Location</label>
                <Select 
                  value={wishLocationId} 
                  onChange={e => setWishLocationId(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Linked Savings Goal</label>
                <Select 
                  value={wishSavingsGoalId} 
                  onChange={e => setWishSavingsGoalId(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="">No goal linked</option>
                  {savingsGoals.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
                </Select>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Aspirational Notes</label>
              <textarea 
                value={wishNotes}
                onChange={e => setWishNotes(e.target.value)}
                placeholder="Why do I want this?"
                className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 resize-none h-16"
              />
            </div>

            <button 
              onClick={handleAddWishlist}
              disabled={!wishName}
              className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-pink-500/20 disabled:opacity-50 transition-all"
            >
              Add to Wishlist
            </button>
          </div>
        </Modal>
      )}

      {/* --- Acquire Wishlist Item Modal --- */}
      {wishlistToAcquire && (
        <Modal title="Acquire Wishlist Item" onClose={() => setWishlistToAcquire(null)}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-bold leading-relaxed mb-1">
              Move <span className="text-primary font-black uppercase">"{wishlistToAcquire.name}"</span> into physical active inventory.
            </p>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Actual Purchase Price (₹)</label>
              <input 
                type="number" 
                value={acquirePrice}
                onChange={e => setAcquirePrice(e.target.value)}
                placeholder="₹"
                className="w-full bg-transparent border-none p-0 text-base font-black focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Initial Location</label>
                <Select 
                  value={acquireLocationId} 
                  onChange={e => setAcquireLocationId(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Condition</label>
                <Select 
                  value={acquireCondition} 
                  onChange={e => setAcquireCondition(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>
              </div>
            </div>

            {wishlistToAcquire.savings_goal_id && (
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer bg-muted/20 p-4 rounded-2xl border border-border/20">
                <input 
                  type="checkbox" 
                  checked={completeSavingsGoal} 
                  onChange={e => setCompleteSavingsGoal(e.target.checked)}
                  className="rounded border-border/40 accent-primary" 
                />
                <div>
                  <span className="font-black text-foreground">Mark linked Savings Goal as Completed</span>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">This will update status in Savings Goals.</p>
                </div>
              </label>
            )}

            <button 
              onClick={handleAcquireWishlist}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-emerald-500/20 transition-all"
            >
              Confirm Acquisition
            </button>
          </div>
        </Modal>
      )}

      {/* --- Add Maintenance Schedule Modal --- */}
      {showAddScheduleModal && (
        <Modal title="Add Recurring Maintenance" onClose={() => setShowAddScheduleModal(false)}>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Task Name</label>
              <input 
                autoFocus
                type="text" 
                value={maintTaskName}
                onChange={e => setMaintTaskName(e.target.value)}
                placeholder="e.g. Descale Espresso Maker"
                className="w-full bg-transparent border-none p-0 text-base font-black focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Frequency Interval</label>
                <input 
                  type="number" 
                  value={maintFreqValue}
                  onChange={e => setMaintFreqValue(e.target.value)}
                  placeholder="3"
                  className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Unit</label>
                <Select 
                  value={maintFreqUnit} 
                  onChange={e => setMaintFreqUnit(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </Select>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Last Upkeep Date</label>
              <input 
                type="date" 
                value={maintLastPerformed}
                onChange={e => setMaintLastPerformed(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
              />
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Special Instructions / Notes</label>
              <textarea 
                value={maintNotes}
                onChange={e => setMaintNotes(e.target.value)}
                placeholder="Step by step upkeep directions..."
                className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 resize-none h-16"
              />
            </div>

            <button 
              onClick={handleAddMaintenanceSchedule}
              disabled={!maintTaskName}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-primary/20 disabled:opacity-50 transition-all"
            >
              Add Schedule
            </button>
          </div>
        </Modal>
      )}

      {/* --- Log Maintenance Completion Modal --- */}
      {showLogMaintModal && (
        <Modal title="Log Completed Maintenance" onClose={() => setShowLogMaintModal(null)}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-bold leading-relaxed mb-1">
              Log execution detail for task <span className="text-primary font-black uppercase">"{showLogMaintModal.task_name}"</span>.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Performed Date</label>
                <input 
                  type="date" 
                  value={logMaintDate}
                  onChange={e => setLogMaintDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Maintenance Cost (₹)</label>
                <input 
                  type="number" 
                  value={logMaintCost}
                  onChange={e => setLogMaintCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-none p-0 text-xs font-black focus:ring-0"
                />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
              <label className="text-[9px] font-black text-muted-foreground/60 block mb-2">Completion Notes / Log details</label>
              <textarea 
                value={logMaintNotes}
                onChange={e => setLogMaintNotes(e.target.value)}
                placeholder="Log details, parts replaced, tech info..."
                className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 resize-none h-20"
              />
            </div>

            <button 
              onClick={handleLogMaintenanceCompletion}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-emerald-500/20 transition-all"
            >
              Log Upkeep Completion
            </button>
          </div>
        </Modal>
      )}

    </PageWrapper>
  );
}
