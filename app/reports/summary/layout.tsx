import React from "react";

// Layout shell for /reports/summary/*
// Shared SectionNav is rendered inside each page to avoid double-header issues
// with the parent /reports page. Children render independently.
export default function SummaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
