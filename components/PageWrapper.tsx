"use client";

import React from "react";
import { PageHeader } from "./PageHeader";
import { SectionNav } from "./SectionNav";
import type { TabItem } from "./SectionNav";

interface PageWrapperProps {
  /** Page title shown in PageHeader */
  title?: string;
  /** If provided, shows a report link button in PageHeader */
  reportHref?: string;
  /** If provided, renders SectionNav with these tabs */
  sectionTabs?: TabItem[];
  /** Active path override for SectionNav (defaults to current pathname) */
  activePath?: string;
  /** Extra action buttons rendered in the PageHeader actions area */
  headerActions?: React.ReactNode;
  /** Replaces the entire header section with custom content (e.g. Dashboard greeting) */
  customHeader?: React.ReactNode;
  /** Additional className for the outer wrapper (e.g. "pb-48" override) */
  className?: string;
  /** Page content */
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("PageWrapper Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card border border-rose-500/20 rounded-2xl p-6 my-4 text-center space-y-3">
          <h3 className="text-sm font-black text-rose-500 uppercase tracking-wider">Something went wrong</h3>
          <p className="text-xs font-medium text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function PageWrapper({
  title,
  reportHref,
  sectionTabs,
  activePath,
  headerActions,
  customHeader,
  className,
  children,
}: PageWrapperProps) {
  return (
    <div className={`flex flex-col min-h-screen bg-background pb-24 ${className || ""}`}>
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        {customHeader ? (
          customHeader
        ) : title ? (
          <PageHeader title={title} reportHref={reportHref}>
            {headerActions}
          </PageHeader>
        ) : null}

        {sectionTabs && sectionTabs.length > 0 && (
          <div className="-mt-2 mb-6">
            <SectionNav tabs={sectionTabs} activePath={activePath} />
          </div>
        )}

        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  );
}
