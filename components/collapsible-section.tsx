"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

const STORAGE_PREFIX = "collapsed-section:";

// Collapse state is a global "which mode am I in" preference (developer vs
// financial view), not per-project — same key everywhere this section id is
// used, matching how the tasks board/list view choice already persists.
export function CollapsibleSection({
  id,
  title,
  action,
  defaultCollapsed = false,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_PREFIX + id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true" || stored === "false") setCollapsed(stored === "true");
  }, [id]);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_PREFIX + id, String(next));
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700"
        >
          <ChevronDownIcon
            className={`size-3.5 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
          {title}
        </button>
        {action}
      </div>
      {!collapsed && <div className="mt-3">{children}</div>}
    </section>
  );
}
