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

        {children}
      </div>
    </div>
  );
}
