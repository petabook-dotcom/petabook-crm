"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

const STORAGE_KEY = "sidebar-collapsed";
const NO_SHELL_PATHS = ["/access"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  if (NO_SHELL_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen md:grid md:transition-[grid-template-columns] md:duration-200 ${
        collapsed ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[240px_minmax(0,1fr)]"
      }`}
    >
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <main className="min-w-0 px-4 pb-12 pt-20 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
