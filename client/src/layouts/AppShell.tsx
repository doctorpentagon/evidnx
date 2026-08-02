import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpen, ClipboardList, Database, FileText, GraduationCap, LayoutDashboard, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useCurrentProject } from "@/providers/CurrentProjectContext";
import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type { Project } from "@/features/dashboard/types/project";

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { to: "/app/data", label: "Data", icon: Database },
  { to: "/app/analysis", label: "Analysis", icon: BarChart3 },
  { to: "/app/literature", label: "Literature", icon: BookOpen },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/learn", label: "Learn", icon: GraduationCap },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={twMerge("flex items-center gap-2", compact ? "px-1" : "px-6 py-6")}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-lg font-extrabold text-white">E</span><span className="text-heading-sm font-bold text-white">EvidNX</span></Link>;
}

function CurrentProjectIndicator() {
  const { currentProjectId } = useCurrentProject();
  const { data: project } = useQuery({
    queryKey: ["projects", currentProjectId],
    queryFn: async () => (await api.get<ApiEnvelope<Project>>(`/projects/${currentProjectId}`)).data.data,
    enabled: currentProjectId !== null,
  });

  if (!currentProjectId) return <span className="truncate text-secondary text-ink-muted">No project selected</span>;
  return <NavLink to={`/app/projects/${currentProjectId}`} className="truncate text-secondary font-medium text-ink hover:text-brand-600">{project ? project.name : "Loading…"}</NavLink>;
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Workspace navigation">{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/app"} onClick={onNavigate} className={({ isActive }) => twMerge("flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-secondary font-medium text-navy-100 transition-colors duration-fast hover:bg-navy-700 hover:text-white", isActive && "bg-brand-500 text-white hover:bg-brand-500")}><Icon className="h-[18px] w-[18px] shrink-0" />{label}</NavLink>)}</nav>;
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="flex min-h-dvh bg-surface-canvas">
      <aside className="hidden w-[220px] shrink-0 flex-col bg-navy-800 lg:flex"><BrandMark /><Navigation /></aside>

      {drawerOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-ink/45" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} /><aside className="relative flex h-full w-[min(82vw,300px)] flex-col bg-navy-800 shadow-2xl"><div className="flex items-center justify-between pr-3"><BrandMark /><button className="flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-navy-700" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div><Navigation onNavigate={() => setDrawerOpen(false)} /></aside></div> : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-surface-border bg-surface-card px-4 sm:px-6 lg:px-8">
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-surface-border text-ink lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1"><CurrentProjectIndicator /></div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-secondary font-semibold text-brand-700">E</div>
        </header>
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
