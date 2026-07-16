'use client';

import React, { useState } from 'react';
import { BarChart2 } from "lucide-react";
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Trash2, CreditCard, PieChart, Activity, Settings, Target } from 'lucide-react';

const DUMMY_TABS = [
  { name: 'Dashboard', icon: PieChart, id: '1' },
  { name: 'Activity', icon: Activity, id: '2' },
  { name: 'Targets', icon: Target, id: '3' },
  { name: 'Settings', icon: Settings, id: '4' },
];

export default function NavStylesPlayground() {
  const [activeTab, setActiveTab] = useState('1');
  const [styles, setStyles] = useState([
    { id: 'style-1', title: '1. The Original (Outlined)' },
    { id: 'style-2', title: '2. Soft Pill (Modern Minimal)' },
    { id: 'style-3', title: '3. iOS Segmented Control' },
    { id: 'style-4', title: '4. Minimal Underline (Classic)' },
    { id: 'style-5', title: '5. Gradient Glow (Glassmorphism)' },
    { id: 'style-6', title: '6. Neumorphic Soft Pop' },
    { id: 'style-7', title: '7. Dynamic Dot Indicator' },
    { id: 'style-8', title: '8. Floating Bubbles' },
    { id: 'style-9', title: '9. Stark High Contrast' },
    { id: 'style-10', title: '10. The Folder Tab' },
  ]);

  const handleDelete = (id: string) => {
    setStyles(styles.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 text-foreground font-dm-sans">
      <div className="max-w-xl mx-auto w-full p-4 md:p-6 pb-0">
        <PageHeader title="Nav Styles Showcase" >
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
        <p className="text-sm text-muted-foreground mb-8">
          10 Professional UI styles for section navigation. Delete the ones you don't like to compare your favorites.
        </p>
      </div>

      <div className="max-w-xl mx-auto w-full p-4 md:p-6 pt-0 space-y-12">
        {styles.map((style) => (
          <div key={style.id} className="relative group p-4 border border-border/20 rounded-3xl bg-card shadow-sm hover:border-indigo-500/30 transition-colors">
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black tracking-widest uppercase text-muted-foreground/60">{style.title}</h2>
              <button 
                onClick={() => handleDelete(style.id)}
                className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* STYLE 1: The Original */}
            {style.id === 'style-1' && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-5 h-12 rounded-2xl font-black text-sm transition-all whitespace-nowrap shrink-0 border-2 ${ isActive ? 'border-foreground text-background bg-foreground shadow-lg' : 'border-border/50 text-muted-foreground bg-transparent hover:border-border hover:bg-muted/50' }`}
                    >
                      <Icon size={18} className={isActive ? 'text-background' : 'text-muted-foreground/50'} />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 2: Soft Pill */}
            {style.id === 'style-2' && (
              <div className="flex items-center p-1.5 gap-1 bg-muted/30 rounded-full overflow-x-auto no-scrollbar">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-4 h-10 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${ isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground' }`}
                    >
                      <Icon size={16} />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 3: iOS Segmented Control */}
            {style.id === 'style-3' && (
              <div className="flex items-center p-1 bg-muted/50 rounded-[14px] w-full max-w-full overflow-x-auto no-scrollbar">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 h-9 rounded-[10px] font-semibold text-xs transition-all whitespace-nowrap min-w-fit ${ isActive ? 'bg-background text-foreground shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground' }`}
                    >
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 4: Minimal Underline */}
            {style.id === 'style-4' && (
              <div className="flex items-center gap-6 border-b border-border/40 overflow-x-auto no-scrollbar">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 pb-3 pt-1 font-bold text-sm transition-all whitespace-nowrap shrink-0 ${ isActive ? 'text-indigo-500' : 'text-muted-foreground hover:text-foreground' }`}
                    >
                      <tab.icon size={16} className={isActive ? "text-indigo-500" : "opacity-50"} />
                      <span>{tab.name}</span>
                      {isActive && (
                        <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 5: Gradient Glow */}
            {style.id === 'style-5' && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center justify-center gap-2 px-5 h-11 rounded-xl font-bold text-sm transition-all whitespace-nowrap shrink-0 overflow-hidden ${ isActive ? 'text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground' }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-90" />
                      )}
                      <tab.icon size={16} className="relative z-10" />
                      <span className="relative z-10">{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 6: Neumorphic Soft Pop */}
            {style.id === 'style-6' && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar p-3 bg-muted/10 rounded-3xl">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-5 h-12 rounded-2xl font-black text-sm transition-all whitespace-nowrap shrink-0 ${ isActive ? 'bg-card text-primary shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.05)] border border-primary/20' : 'bg-transparent text-muted-foreground shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] border border-transparent hover:text-foreground' }`}
                    >
                      <tab.icon size={18} />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 7: Dynamic Dot Indicator */}
            {style.id === 'style-7' && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-2 transition-all whitespace-nowrap shrink-0 ${ isActive ? 'text-foreground' : 'text-muted-foreground/60 hover:text-foreground' }`}
                    >
                      <div className={`p-3 rounded-2xl transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/30'}`}>
                        <tab.icon size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{tab.name}</span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-primary scale-100' : 'bg-transparent scale-0'}`} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 8: Floating Bubbles */}
            {style.id === 'style-8' && (
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-2">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all shrink-0 ${ isActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110' : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:scale-105' }`}
                    >
                      <tab.icon size={isActive ? 22 : 18} />
                      {!isActive && (
                        <div className="absolute -top-8 bg-foreground text-background text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {tab.name}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 9: Stark High Contrast */}
            {style.id === 'style-9' && (
              <div className="flex items-center gap-0 overflow-x-auto no-scrollbar border-2 border-foreground rounded-xl overflow-hidden shrink-0 w-fit">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-5 h-11 font-black text-xs transition-all whitespace-nowrap border-r-2 border-foreground last:border-r-0 uppercase tracking-widest ${ isActive ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/10' }`}
                    >
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* STYLE 10: The Folder Tab */}
            {style.id === 'style-10' && (
              <div className="flex items-end gap-1 overflow-x-auto no-scrollbar border-b border-border/50 px-2 pt-2">
                {DUMMY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-5 font-bold text-sm transition-all whitespace-nowrap shrink-0 rounded-t-xl border border-b-0 ${ isActive ? 'h-12 bg-card text-indigo-500 border-border/50 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)] z-10 relative' : 'h-10 bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground' }`}
                    >
                      <tab.icon size={16} />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

          </div>
        ))}
        
        {styles.length === 0 && (
          <div className="text-center py-24 opacity-50">
            <p className="font-black">You deleted everything! Refresh the page to see them again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
