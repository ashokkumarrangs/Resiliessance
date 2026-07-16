const fs = require('fs');

function refactor(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Branding / Layout
    content = content.replace(/A<span className="text-rose-500 italic">R<\/span>THA/g, 'HEYYY CONFIG');
    content = content.replace(/bg-\[#111827\] text-white p-6 pt-8 sticky top-0 z-50 shadow-2xl/g, 'bg-card/80 backdrop-blur-md border-b border-border/40 p-6 pt-8 text-foreground sticky top-0 z-50 shadow-sm sm:max-w-xl sm:mx-auto');
    content = content.replace(/bg-slate-50/g, 'bg-background');
    content = content.replace(/text-slate-900/g, 'text-foreground');
    content = content.replace(/text-slate-800/g, 'text-foreground');
    content = content.replace(/text-slate-700/g, 'text-foreground');
    content = content.replace(/text-slate-600/g, 'text-muted-foreground');
    content = content.replace(/text-slate-500/g, 'text-muted-foreground');
    content = content.replace(/text-slate-400/g, 'text-muted-foreground/60');
    content = content.replace(/text-slate-300/g, 'text-muted-foreground/30');
    content = content.replace(/bg-slate-800/g, 'bg-muted');

    // Radii & Cards
    content = content.replace(/rounded-\[2rem\]/g, 'rounded-2xl bg-card/85 backdrop-blur-xl border border-border/40');
    content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-2xl border border-border/40');
    content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-xl');
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    content = content.replace(/rounded-2xl bg-background/g, 'rounded-xl bg-muted/50 border border-border/40');

    // Shadows
    content = content.replace(/shadow-xl shadow-slate-200\/60/g, 'shadow-zenith');

    // Colors: Rose -> Primary, Emerald -> Accent, Blue -> Primary
    content = content.replace(/text-rose-500/g, 'text-primary');
    content = content.replace(/bg-rose-500/g, 'bg-primary');
    content = content.replace(/bg-rose-100/g, 'bg-primary/20');
    content = content.replace(/ring-rose-500/g, 'ring-primary');
    content = content.replace(/bg-rose-50 /g, 'bg-primary/10 ');
    content = content.replace(/text-rose-600/g, 'text-primary');
    content = content.replace(/border-rose-100/g, 'border-primary/20');
    content = content.replace(/shadow-rose-/g, 'shadow-primary/');
    content = content.replace(/focus:ring-rose-500/g, 'focus:ring-primary');

    content = content.replace(/bg-emerald-500/g, 'bg-accent');
    content = content.replace(/text-emerald-500/g, 'text-accent');
    content = content.replace(/bg-emerald-600/g, 'bg-accent');
    content = content.replace(/text-emerald-600/g, 'text-accent-foreground');
    content = content.replace(/bg-emerald-50 /g, 'bg-accent/10 ');
    content = content.replace(/bg-emerald-100/g, 'bg-accent/20');
    content = content.replace(/shadow-emerald-/g, 'shadow-accent/');

    content = content.replace(/bg-blue-600/g, 'bg-primary');
    content = content.replace(/text-blue-600/g, 'text-primary');
    content = content.replace(/bg-blue-500/g, 'bg-primary/80');

    content = content.replace(/border-emerald-/g, 'border-accent/');
    content = content.replace(/border-rose-/g, 'border-primary/');

    // Amber to Warning/Muted 
    content = content.replace(/bg-amber-50 /g, 'bg-muted/30 ');
    content = content.replace(/text-amber-600/g, 'text-foreground/80');
    content = content.replace(/text-amber-700/g, 'text-foreground');
    content = content.replace(/border-amber-200/g, 'border-border/60');
    
    // Manage Habit Page specifics
    content = content.replace(/bg-blue-50/g, 'bg-primary/10');
    
    // Add file back
    fs.writeFileSync(file, content, 'utf8');
}

refactor('app/habits/add/page.tsx');
refactor('app/habits/manage/page.tsx');
