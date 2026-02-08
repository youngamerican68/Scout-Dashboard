"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lightbulb, Hammer } from "lucide-react";
import { format } from "date-fns";
import { Markdown } from "@/components/markdown";
import { ScoutTabs, useScout } from "@/components/scout-tabs";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  source: string | null;
  status: string;
  priority: string;
  notes: string | null;
  updatedAt: string;
  report: { id: string; title: string; source: string } | null;
  build: { id: string; status: string } | null;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary"> = {
  new: "default",
  in_progress: "warning",
  done: "success",
  dismissed: "secondary",
};

const priorityVariant: Record<string, "destructive" | "warning" | "secondary"> = {
  build_now: "destructive",
  backlog: "warning",
  monitor: "secondary",
  skip: "secondary",
};

export default function OpportunitiesPage() {
  const { sourceFilter, labels, scout } = useScout();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sendingBuild, setSendingBuild] = useState<string | null>(null);

  const fetchOpportunities = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    params.set("source", sourceFilter);
    fetch(`/api/opportunities?${params}`)
      .then((res) => res.json())
      .then((data) => setOpportunities(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter, sourceFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const updateOpportunity = async (id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, ...updated } : o))
        );
      }
    } catch {}
  };

  const sendToBuild = async (oppId: string) => {
    setSendingBuild(oppId);
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: oppId }),
      });
      if (res.ok) {
        const build = await res.json();
        setOpportunities((prev) =>
          prev.map((o) =>
            o.id === oppId ? { ...o, status: "in_progress", build: { id: build.id, status: build.status } } : o
          )
        );
      }
    } catch {}
    setSendingBuild(null);
  };

  return (
    <div className="space-y-6">
      <ScoutTabs />

      <div>
        <h1 className="text-2xl font-bold text-white">Opportunities</h1>
        <p className="text-slate-400 mt-1">Ideas and tools from Clawdbot&apos;s {labels.description}</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="dismissed">Dismissed</option>
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {labels.priorities.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Lightbulb className="h-10 w-10 mb-3 text-slate-500" />
            <p className="text-lg font-medium">No opportunities yet</p>
            <p className="text-sm mt-1">Opportunities will appear as reports are analyzed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="hover:border-slate-600 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{opp.title}</h3>
                    {opp.description && (
                      <Markdown content={opp.description} className="text-sm text-slate-400 mt-1" />
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Select
                        value={opp.status}
                        onChange={(e) => updateOpportunity(opp.id, "status", e.target.value)}
                        className="w-auto text-xs h-7 py-0 px-2"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="dismissed">Dismissed</option>
                      </Select>
                      <Select
                        value={opp.priority}
                        onChange={(e) => updateOpportunity(opp.id, "priority", e.target.value)}
                        className="w-auto text-xs h-7 py-0 px-2"
                      >
                        {labels.priorities.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </Select>
                      {!opp.build && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          onClick={() => sendToBuild(opp.id)}
                          disabled={sendingBuild === opp.id}
                        >
                          <Hammer className="h-3.5 w-3.5 mr-1" />
                          {sendingBuild === opp.id ? "Sending..." : "Build"}
                        </Button>
                      )}
                      {opp.build && (
                        <a
                          href={`/builds/${opp.build.id}`}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Hammer className="h-3 w-3" />
                          {opp.build.status}
                        </a>
                      )}
                      {opp.report && (
                        <a
                          href={`/reports/${opp.report.id}?scout=${scout}`}
                          className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          from {opp.report.title}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {format(new Date(opp.updatedAt), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
