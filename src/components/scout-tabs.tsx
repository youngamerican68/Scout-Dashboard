"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, BookOpen } from "lucide-react";

type ScoutType = "twitter" | "journal";

const ScoutContext = createContext<{
  scout: ScoutType;
  setScout: (s: ScoutType) => void;
  sourceFilter: string;
  labels: { itemsScanned: string; itemLabel: string; description: string };
}>({
  scout: "twitter",
  setScout: () => {},
  sourceFilter: "twitter",
  labels: { itemsScanned: "Tweets Scanned", itemLabel: "posts", description: "Twitter & Discord scouting" },
});

export function useScout() {
  return useContext(ScoutContext);
}

const LABELS: Record<ScoutType, { itemsScanned: string; itemLabel: string; description: string }> = {
  twitter: {
    itemsScanned: "Tweets Scanned",
    itemLabel: "posts",
    description: "Twitter & Discord scouting",
  },
  journal: {
    itemsScanned: "Papers Scanned",
    itemLabel: "papers",
    description: "Academic journal scouting",
  },
};

export function ScoutProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [scout, setScoutState] = useState<ScoutType>(
    (searchParams.get("scout") as ScoutType) || "twitter"
  );

  const setScout = (s: ScoutType) => {
    setScoutState(s);
    const params = new URLSearchParams(searchParams.toString());
    params.set("scout", s);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const param = searchParams.get("scout") as ScoutType;
    if (param && (param === "twitter" || param === "journal")) {
      setScoutState(param);
    }
  }, [searchParams]);

  const sourceFilter = scout === "twitter" ? "twitter,discord" : "journal";

  return (
    <ScoutContext.Provider value={{ scout, setScout, sourceFilter, labels: LABELS[scout] }}>
      {children}
    </ScoutContext.Provider>
  );
}

export function ScoutTabs() {
  const { scout, setScout } = useScout();

  const tabs: { id: ScoutType; label: string; icon: typeof MessageSquare }[] = [
    { id: "twitter", label: "Twitter Scout", icon: MessageSquare },
    { id: "journal", label: "Journal Scout", icon: BookOpen },
  ];

  return (
    <div className="flex gap-1 bg-slate-800/80 rounded-lg p-1 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setScout(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
            scout === tab.id
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
