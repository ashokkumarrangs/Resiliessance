import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Inline formatting helper: parses **bold**, *italic*, and [display](url) into React nodes safely
  const parseInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let i = 0;
    const n = text.length;

    while (i < n) {
      // Bold **
      if (text.startsWith("**", i)) {
        const next = text.indexOf("**", i + 2);
        if (next !== -1) {
          tokens.push(<strong key={i}>{text.substring(i + 2, next)}</strong>);
          i = next + 2;
          continue;
        }
      }
      // Italic *
      if (text.startsWith("*", i)) {
        const next = text.indexOf("*", i + 1);
        if (next !== -1) {
          tokens.push(<em key={i}>{text.substring(i + 1, next)}</em>);
          i = next + 1;
          continue;
        }
      }
      // Link [text](url)
      if (text.startsWith("[", i)) {
        const closeBracket = text.indexOf("]", i + 1);
        if (closeBracket !== -1 && text.startsWith("(", closeBracket + 1)) {
          const closeParen = text.indexOf(")", closeBracket + 2);
          if (closeParen !== -1) {
            const displayText = text.substring(i + 1, closeBracket);
            const linkUrl = text.substring(closeBracket + 2, closeParen);
            const isUnsafe = /^\s*(javascript|data|vbscript):/i.test(linkUrl);
            const sanitizedUrl = isUnsafe ? "#" : linkUrl;
            tokens.push(
              <a
                key={i}
                href={sanitizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-black inline-flex items-center gap-0.5"
              >
                {displayText}
              </a>
            );
            i = closeParen + 1;
            continue;
          }
        }
      }
      // Plain text character
      const nextSpecial = Math.min(
        text.indexOf("**", i) === -1 ? n : text.indexOf("**", i),
        text.indexOf("*", i) === -1 ? n : text.indexOf("*", i),
        text.indexOf("[", i) === -1 ? n : text.indexOf("[", i)
      );

      tokens.push(text.substring(i, nextSpecial));
      i = nextSpecial;
    }

    return tokens;
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentListItems: React.ReactNode[] = [];
  let currentTableRows: { cells: string[]; isHeader: boolean }[] = [];

  const flushList = (key: number) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-[13px] leading-relaxed text-foreground">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushTable = (key: number) => {
    if (currentTableRows.length > 0) {
      // Find index of separator row (e.g. |---|) if any, and filter it out
      const cleanRows = currentTableRows.filter(
        (row) => !row.cells.every((cell) => cell.trim().match(/^-+$/))
      );

      if (cleanRows.length > 0) {
        elements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-3 border border-border/40 rounded-xl bg-muted/10">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  {cleanRows[0].cells.map((cell, idx) => (
                    <th key={idx} className="p-2.5 font-black text-muted-foreground uppercase tracking-wider">
                      {parseInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cleanRows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                    {row.cells.map((cell, cellIdx) => (
                      <td key={cellIdx} className="p-2.5 text-foreground font-medium">
                        {parseInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      currentTableRows = [];
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // 1. Table parser
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList(idx);
      const cells = trimmed
        .split("|")
        .slice(1, -1) // remove leading and trailing empty cell splits
        .map((c) => c.trim());

      // If it's a separator line (like |---|---|), skip/mark as separator
      const isSeparator = cells.every((c) => c.match(/^-+$/));
      currentTableRows.push({ cells, isHeader: currentTableRows.length === 0 && !isSeparator });
      continue;
    } else {
      flushTable(idx);
    }

    // 2. Bullet list parser
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const contentText = trimmed.substring(2);
      currentListItems.push(
        <li key={`li-${idx}`} className="text-foreground font-medium">
          {parseInline(contentText)}
        </li>
      );
      continue;
    } else {
      flushList(idx);
    }

    // 3. Headers
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h6 key={idx} className="text-[11.5px] font-black text-primary mt-4 mb-2 uppercase tracking-widest border-b border-border/10 pb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {parseInline(trimmed.substring(5))}
        </h6>
      );
      continue;
    }
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h5 key={idx} className="text-[14px] font-black text-foreground mt-4 mb-2 uppercase tracking-wide">
          {parseInline(trimmed.substring(4))}
        </h5>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h4 key={idx} className="text-[16px] font-black text-foreground mt-5 mb-2.5">
          {parseInline(trimmed.substring(3))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h3 key={idx} className="text-[18px] font-black text-foreground mt-6 mb-3">
          {parseInline(trimmed.substring(2))}
        </h3>
      );
      continue;
    }

    // 4. Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={idx} className="border-l-4 border-primary/30 pl-3.5 py-1 my-3 bg-muted/10 rounded-r-xl italic text-muted-foreground text-[12px] leading-relaxed">
          {parseInline(trimmed.substring(2))}
        </blockquote>
      );
      continue;
    }

    // 5. Empty space
    if (trimmed === "") {
      // Just add a margin spacer if not empty end
      elements.push(<div key={idx} className="h-2" />);
      continue;
    }

    // 6. Normal Paragraph
    elements.push(
      <p key={idx} className="text-[13px] font-medium leading-relaxed text-foreground/90 my-1.5">
        {parseInline(line)}
      </p>
    );
  }

  // Flush remaining lists or tables
  flushList(lines.length);
  flushTable(lines.length);

  return <div className="space-y-1">{elements}</div>;
}
