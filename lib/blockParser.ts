export interface EditorBlock {
  id: string;
  type: "paragraph" | "header" | "list" | "table" | "quote" | "link";
  heading?: string; // Optional heading context box for every block!
  text?: string;
  author?: string;
  url?: string;
  listItems?: string[];
  tableRows?: string[][]; // 2D array: [row][column]
}

// Generates a simple unique ID for local block rendering
const genId = () => Math.random().toString(36).substring(2, 9);

// Convert structured editor blocks to Markdown string for database storage
export function serializeBlocksToMarkdown(blocks: EditorBlock[]): string {
  return blocks
    .map((block) => {
      let blockContent = "";
      switch (block.type) {
        case "header":
          blockContent = `### ${block.text || ""}`;
          break;
        
        case "paragraph":
          blockContent = block.text || "";
          break;
        
        case "quote":
          blockContent = `> ${block.text || ""}\n— ${block.author || ""}`;
          break;
        
        case "link":
          blockContent = `[${block.text || ""}](${block.url || ""})`;
          break;
        
        case "list": {
          const items = block.listItems || [];
          blockContent = items.length === 0 ? "- " : items.map((item) => `- ${item}`).join("\n");
          break;
        }
        
        case "table": {
          const rows = block.tableRows || [["Header 1", "Header 2"], ["", ""]];
          if (rows.length === 0) {
            blockContent = "| | |\n|---|---|\n| | |";
          } else {
            const headerLine = `| ${rows[0].join(" | ")} |`;
            const separatorLine = `| ${rows[0].map(() => "---").join(" | ")} |`;
            const bodyLines = rows.slice(1).map((row) => `| ${row.join(" | ")} |`);
            blockContent = [headerLine, separatorLine, ...bodyLines].join("\n");
          }
          break;
        }
        
        default:
          blockContent = "";
      }

      if (block.heading && block.heading.trim()) {
        return `#### ${block.heading.trim()}\n${blockContent}`;
      }
      return blockContent;
    })
    .join("\n\n");
}

// Parse Markdown string from database back to structured editor blocks
export function deserializeMarkdownToBlocks(markdown: string | null): EditorBlock[] {
  if (!markdown) {
    return [{ id: genId(), type: "paragraph", text: "" }];
  }

  // Split markdown by double line breaks to get paragraphs/blocks
  const blocksRaw = markdown.split(/\n\n+/);
  const blocks: EditorBlock[] = [];

  blocksRaw.forEach((blockStr) => {
    let blockStrTrimmed = blockStr.trim();
    if (!blockStrTrimmed) return;

    let heading: string | undefined = undefined;

    // Check if the block has a header marker ####
    if (blockStrTrimmed.startsWith("#### ")) {
      const firstLineEnd = blockStrTrimmed.indexOf("\n");
      if (firstLineEnd !== -1) {
        heading = blockStrTrimmed.substring(5, firstLineEnd).trim();
        blockStrTrimmed = blockStrTrimmed.substring(firstLineEnd + 1).trim();
      } else {
        heading = blockStrTrimmed.substring(5).trim();
        blockStrTrimmed = "";
      }
    }

    let parsedBlock: Partial<EditorBlock> | null = null;

    // 1. Table Check
    if (blockStrTrimmed.startsWith("|")) {
      const lines = blockStrTrimmed.split("\n").map((line) => line.trim());
      const tableRows: string[][] = [];

      lines.forEach((line) => {
        // Skip separator lines like |---|---|
        if (line.match(/^\|[ \t\-:|]+\|$/)) return;
        
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        
        if (cells.length > 0) {
          tableRows.push(cells);
        }
      });

      if (tableRows.length > 0) {
        parsedBlock = { type: "table", tableRows };
      }
    }

    // 2. List Check
    if (!parsedBlock && (blockStrTrimmed.startsWith("- ") || blockStrTrimmed.startsWith("* "))) {
      const listItems = blockStrTrimmed
        .split("\n")
        .map((line) => {
          const tLine = line.trim();
          if (tLine.startsWith("- ")) return tLine.substring(2);
          if (tLine.startsWith("* ")) return tLine.substring(2);
          return tLine;
        });
      
      parsedBlock = { type: "list", listItems };
    }

    // 3. Link Check (standalone block: [text](url))
    if (!parsedBlock) {
      const linkMatch = blockStrTrimmed.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
      if (linkMatch) {
        parsedBlock = { type: "link", text: linkMatch[1], url: linkMatch[2] };
      }
    }

    // 4. Header Check
    if (!parsedBlock) {
      if (blockStrTrimmed.startsWith("### ")) {
        parsedBlock = { type: "header", text: blockStrTrimmed.substring(4) };
      } else if (blockStrTrimmed.startsWith("## ")) {
        parsedBlock = { type: "header", text: blockStrTrimmed.substring(3) };
      } else if (blockStrTrimmed.startsWith("# ")) {
        parsedBlock = { type: "header", text: blockStrTrimmed.substring(2) };
      }
    }

    // 5. Quote Check
    if (!parsedBlock && blockStrTrimmed.startsWith("> ")) {
      const lines = blockStrTrimmed.split("\n").map((l) => l.trim());
      const quoteText = lines[0].substring(2);
      let author = "";
      
      if (lines.length > 1 && lines[1].startsWith("—")) {
        author = lines[1].substring(1).trim();
      } else if (lines.length > 1 && lines[1].startsWith("-")) {
        author = lines[1].substring(1).trim();
      }
      
      parsedBlock = { type: "quote", text: quoteText, author };
    }

    // 6. Default Fallback -> Paragraph Block
    if (!parsedBlock) {
      parsedBlock = { type: "paragraph", text: blockStrTrimmed };
    }

    blocks.push({
      id: genId(),
      heading,
      type: parsedBlock.type || "paragraph",
      text: parsedBlock.text,
      author: parsedBlock.author,
      url: parsedBlock.url,
      listItems: parsedBlock.listItems,
      tableRows: parsedBlock.tableRows,
    });
  });

  if (blocks.length === 0) {
    return [{ id: genId(), type: "paragraph", text: "" }];
  }

  return blocks;
}
