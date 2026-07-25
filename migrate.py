import os
import re

files = [
  "app/reports/page.tsx",
  "app/reports/finance/page.tsx",
  "app/reports/habits/page.tsx",
  "app/reports/workout/page.tsx",
  "app/reports/vehicles/page.tsx",
  "app/reports/tasks/page.tsx",
  "app/reports/skills/page.tsx",
  "app/reports/pets/page.tsx",
  "app/reports/correlations/page.tsx",
  "app/reports/weekly-summary/page.tsx",
]

summary_files = [
  "app/reports/summary/monthly/page.tsx",
  "app/reports/summary/weekly/page.tsx",
  "app/reports/summary/yearly/page.tsx"
]

base_path = "/Volumes/SquareShift/Projects/Resiliessance/"

def process_file(file, is_summary):
    full_path = os.path.join(base_path, file)
    if not os.path.exists(full_path):
        print("File not found:", full_path)
        return
        
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'import { PageWrapper }' in content:
        return
        
    # Remove imports
    content = re.sub(r'import \{ PageHeader \} from "@/components/PageHeader";\n?', '', content)
    content = re.sub(r'import \{ SectionNav \} from "@/components/SectionNav";\n?', '', content)
    
    # Add imports
    import_wrapper = 'import { PageWrapper } from "@/components/PageWrapper";'
    tabs_import = 'import { SUMMARY_TABS } from "@/lib/navigation";' if is_summary else 'import { REPORT_TABS } from "@/lib/navigation";'
    
    content = re.sub(r'("use client";\n)', r'\1' + import_wrapper + '\n' + tabs_import + '\n', content, count=1)
    
    # Extract title
    title = "Intelligence"
    title_match = re.search(r'<PageHeader[^>]*title="([^"]+)"', content)
    if title_match:
        title = title_match.group(1)
        
    # Extract header actions
    header_actions = ""
    header_match = re.search(r'<PageHeader[^>]*>([\s\S]*?)<\/PageHeader>', content)
    if header_match and header_match.group(1).strip() != "":
        header_actions = header_match.group(1).strip()
        
    if not is_summary:
        # Standard report pages
        # The wrapper might be slightly different in spacing, so we use regex
        old_wrapper_re = r'<div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">\s*<PageHeader[^>]*>[\s\S]*?<\/PageHeader>\s*<div className="-mt-2 mb-6">\s*<SectionNav tabs=\{\[[\s\S]*?\]\} \/>\s*<\/div>'
        
        replacement = f'<PageWrapper\n  title="{title}"\n  sectionTabs={{REPORT_TABS}}\n'
        if header_actions:
            replacement += f'  headerActions={{\n    {header_actions}\n  }}\n'
        replacement += '>'
        
        if re.search(old_wrapper_re, content):
            content = re.sub(old_wrapper_re, replacement, content, count=1)
        else:
            print(f"Fallback wrapper replacement for {file}")
            content = re.sub(r'<div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">', 
                f'<PageWrapper title="{title}" sectionTabs={{REPORT_TABS}}{" headerActions={{" + header_actions + "}}" if header_actions else ""}>', content, count=1)
            content = re.sub(r'<PageHeader[^>]*>[\s\S]*?<\/PageHeader>', '', content)
            content = re.sub(r'<div className="-mt-2 mb-6">\s*<SectionNav tabs=\{\[[\s\S]*?\]\} \/>\s*<\/div>', '', content)
            content = re.sub(r'<PageHeader[^>]*\/>', '', content)
            
        # replace last </div>
        last_div_idx = content.rfind('</div>')
        if last_div_idx != -1:
            content = content[:last_div_idx] + '</PageWrapper>' + content[last_div_idx+6:]
            
    else:
        # Summary pages
        old_wrapper_re = r'<div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">\s*<PageHeader[^>]*>([\s\S]*?)<\/PageHeader>'
        old_wrapper_re_self = r'<div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">\s*<PageHeader[^>]*\/>'
        
        replacement = f'<PageWrapper title="{title}"'
        if header_actions:
            replacement += f' headerActions={{{header_actions}}}'
        replacement += '>'
        
        if re.search(old_wrapper_re, content):
            content = re.sub(old_wrapper_re, replacement, content, count=1)
        elif re.search(old_wrapper_re_self, content):
            content = re.sub(old_wrapper_re_self, replacement, content, count=1)
            
        # replace <SectionNav tabs={[...]} /> with <SectionNav tabs={SUMMARY_TABS} />
        # we still want SectionNav imported in summary pages, so let's re-add the import if it's there
        if 'import { SectionNav }' not in content:
            content = content.replace('import { PageWrapper } from "@/components/PageWrapper";', 'import { PageWrapper } from "@/components/PageWrapper";\nimport { SectionNav } from "@/components/SectionNav";')
            
        content = re.sub(r'<SectionNav tabs=\{\[[\s\S]*?\]\} \/>', '<SectionNav tabs={SUMMARY_TABS} />', content)
        
        last_div_idx = content.rfind('</div>')
        if last_div_idx != -1:
            content = content[:last_div_idx] + '</PageWrapper>' + content[last_div_idx+6:]
            
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Processed", file)

for f in files:
    process_file(f, False)
for f in summary_files:
    process_file(f, True)
