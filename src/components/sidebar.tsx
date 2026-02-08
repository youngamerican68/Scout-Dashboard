"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Hammer,
  BarChart3,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Opportunities", href: "/opportunities", icon: Lightbulb },
  { name: "Builds", href: "/builds", icon: Hammer },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 bg-slate-800 border-b border-slate-700 px-4 md:hidden">
        <button onClick={() => setOpen(true)} className="text-slate-300">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">CB</span>
          </div>
          <span className="text-sm font-semibold text-white">Clawdbot</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-slate-800 border-r border-slate-700 transition-transform duration-200",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Clawdbot</h1>
              <p className="text-xs text-slate-400">Scout Tracker</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
