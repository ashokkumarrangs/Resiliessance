'use client';

import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Trash2, ArchiveRestore, Pause, Archive , BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InactiveOptionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-2xl mx-auto w-full p-4 md:p-6 space-y-16">
        <PageHeader title="Inactive Tab Concepts" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/habits" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>

        {/* OPTION 1 */}
        <div className="space-y-6">
           <div>
              <h2 className="text-2xl font-black text-primary">Option 1: Sectioned Headers</h2>
              <p className="text-muted-foreground text-sm">Separated into distinct lists. Cleanest structure.</p>
           </div>
           
           <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 border-b border-border/40 pb-2">On Hold (Paused)</div>
              <Card className="border border-amber-500/20 bg-card">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-lg">🏃</div>
                       <div>
                          <div className="font-bold">Morning Run</div>
                          <div className="text-xs text-muted-foreground">Paused 3 days ago</div>
                       </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-amber-500 hover:text-amber-600"><Play className="w-4 h-4 mr-2"/> Resume</Button>
                 </CardContent>
              </Card>

              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-border/40 pb-2 pt-4">The Vault (Archived)</div>
              <Card className="border border-border/40 bg-card">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center text-lg">💧</div>
                       <div>
                          <div className="font-bold">Drink Water</div>
                          <div className="text-xs text-muted-foreground">Archived on Oct 12</div>
                       </div>
                    </div>
                    <Button variant="outline" size="sm"><ArchiveRestore className="w-4 h-4 mr-2"/> Restore</Button>
                 </CardContent>
              </Card>

              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border-b border-border/40 pb-2 pt-4">Trash (Deleted)</div>
              <Card className="border border-red-500/20 bg-card">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-lg">📚</div>
                       <div>
                          <div className="font-bold">Read 10 Pages</div>
                          <div className="text-xs text-muted-foreground">Deleted yesterday</div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"><RotateCcw className="w-4 h-4"/></Button>
                        <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

        <hr className="border-border/40" />

        {/* OPTION 2 */}
        <div className="space-y-6">
           <div>
              <h2 className="text-2xl font-black text-primary">Option 2: Interactive Filter Pills</h2>
              <p className="text-muted-foreground text-sm">A single list driven by quick filters.</p>
           </div>
           
           <div className="flex gap-2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">All (3)</Badge>
              <Badge variant="outline" className="px-4 py-1 hover:bg-muted cursor-pointer">Paused</Badge>
              <Badge variant="outline" className="px-4 py-1 hover:bg-muted cursor-pointer">Archived</Badge>
              <Badge variant="outline" className="px-4 py-1 hover:bg-muted cursor-pointer text-red-500 border-red-500/30">Trash</Badge>
           </div>

           <div className="space-y-3">
              <Card className="border border-border/40">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">🏃</div>
                       <div>
                          <div className="font-bold flex items-center gap-2">Morning Run <Badge variant="secondary" className="text-[8px] bg-amber-500/20 text-amber-500">PAUSED</Badge></div>
                       </div>
                    </div>
                 </CardContent>
              </Card>
              <Card className="border border-border/40">
                 <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">💧</div>
                       <div>
                          <div className="font-bold flex items-center gap-2">Drink Water <Badge variant="secondary" className="text-[8px]">ARCHIVED</Badge></div>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

        <hr className="border-border/40" />

        {/* OPTION 3 */}
        <div className="space-y-6">
           <div>
              <h2 className="text-2xl font-black text-primary">Option 3: The Fading Effect</h2>
              <p className="text-muted-foreground text-sm">Using opacity and strikethroughs to show state.</p>
           </div>
           
           <div className="space-y-3">
              {/* Paused */}
              <Card className="border border-border/40 grayscale opacity-80">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">🏃</div>
                    <div className="font-bold">Morning Run</div>
                 </CardContent>
              </Card>
              {/* Archived */}
              <Card className="border border-border/40 opacity-40">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">💧</div>
                    <div className="font-bold">Drink Water</div>
                 </CardContent>
              </Card>
              {/* Deleted */}
              <Card className="border border-border/40 opacity-20">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">📚</div>
                    <div className="font-bold line-through text-red-500">Read 10 Pages</div>
                 </CardContent>
              </Card>
           </div>
        </div>

        <hr className="border-border/40" />

        {/* OPTION 4 */}
        <div className="space-y-6">
           <div>
              <h2 className="text-2xl font-black text-primary">Option 4: Overlaid Icons</h2>
              <p className="text-muted-foreground text-sm">Strong visual symbols layered on top of the emoji.</p>
           </div>
           
           <div className="space-y-3">
              <Card className="border border-border/40">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xl opacity-60">
                       🏃
                       <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                          <Pause className="w-6 h-6 text-amber-500 fill-amber-500" />
                       </div>
                    </div>
                    <div className="font-bold">Morning Run</div>
                 </CardContent>
              </Card>
              <Card className="border border-border/40">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xl opacity-60">
                       💧
                       <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                          <Archive className="w-5 h-5 text-slate-400" />
                       </div>
                    </div>
                    <div className="font-bold">Drink Water</div>
                 </CardContent>
              </Card>
           </div>
        </div>

        <hr className="border-border/40" />

        {/* OPTION 5 */}
        <div className="space-y-6">
           <div>
              <h2 className="text-2xl font-black text-primary">Option 5: Card Borders</h2>
              <p className="text-muted-foreground text-sm">Changing the physical boundary of the card.</p>
           </div>
           
           <div className="space-y-3">
              <Card className="border-2 border-dashed border-amber-500/50 bg-amber-500/5">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-lg">🏃</div>
                    <div className="font-bold text-amber-500">Morning Run</div>
                 </CardContent>
              </Card>
              <Card className="border-0 bg-muted/40">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg grayscale opacity-50">💧</div>
                    <div className="font-bold text-muted-foreground">Drink Water</div>
                 </CardContent>
              </Card>
              <Card className="border border-red-500/30 bg-red-500/10">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-lg grayscale opacity-50">📚</div>
                    <div className="font-bold text-red-500">Read 10 Pages</div>
                 </CardContent>
              </Card>
           </div>
        </div>

      </div>
    </div>
  );
}
