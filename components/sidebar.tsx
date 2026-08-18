"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/access/actions";
import {
  BattlesheetIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CrmIcon,
  MenuIcon,
  PipelineIcon,
  TemplatesIcon,
} from "@/components/icons";

const groups = [
  {
    label: "Vendas",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: CrmIcon },
      { href: "/pipeline", label: "Pipeline", icon: PipelineIcon },
      { href: "/templates", label: "Templates de contacto", icon: TemplatesIcon },
      { href: "/battlesheet", label: "Battlesheet", icon: BattlesheetIcon },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md p-2 text-muted hover:bg-neutral-100 hover:text-foreground"
          aria-label={open ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Fechar navegação"
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-20 w-60 border-r border-border bg-[#f1f1ef] px-3 py-5 transition-[transform,width] md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0 pt-20" : "-translate-x-full"
        } ${collapsed ? "md:w-[76px]" : "md:w-60"}`}
      >
        <div
          className={`mb-8 hidden items-center gap-1 px-2 md:flex ${
            collapsed ? "md:justify-center" : "md:justify-between"
          }`}
        >
          {!collapsed && <Brand />}
          {collapsed && <BrandMark />}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-md p-1.5 text-muted hover:bg-white/70 hover:text-foreground"
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
          </button>
        </div>
        <nav aria-label="Navegação principal" className="space-y-7">
          {groups.map((group) => (
            <div key={group.label}>
              <p
                className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      title={collapsed ? label : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        collapsed ? "md:justify-center md:px-0" : ""
                      } ${
                        active
                          ? "bg-white text-foreground shadow-sm"
                          : "text-neutral-600 hover:bg-white/70 hover:text-foreground"
                      }`}
                    >
                      <Icon className={active ? "text-accent" : ""} />
                      <span className={collapsed ? "md:hidden" : ""}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className={`absolute inset-x-3 bottom-5 ${collapsed ? "md:px-1" : ""}`}>
          <form action={logoutAction}>
            <button
              type="submit"
              title={collapsed ? "Sair" : undefined}
              className={`w-full rounded-md px-3 py-2 text-left text-xs font-medium text-neutral-500 hover:bg-white/70 hover:text-foreground ${
                collapsed ? "md:px-0 md:text-center" : ""
              }`}
            >
              <span className={collapsed ? "md:hidden" : ""}>Sair · Petabook CRM v0.1</span>
              <span className={collapsed ? "hidden md:inline" : "hidden"}>Sair</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link href="/pipeline" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
        P
      </span>
      Petabook CRM
    </Link>
  );
}

function BrandMark() {
  return (
    <Link href="/pipeline" aria-label="Petabook CRM" className="font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
        P
      </span>
    </Link>
  );
}
