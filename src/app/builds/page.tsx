"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hammer, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ScoutTabs } from "@/components/scout-tabs";

interface DashboardBuild {
  id: string;
  projectName: string;
  status: string;
  deployUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  opportunity: { id: string; title: string; priority: string } | null;
}

interface QueueBuild {
  name?: string;
  projectName?: string;
  status?: string;
  prompt?: string;
  [key: string]: unknown;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  pending: "default",
  building: "warning",
  complete: "success",
  failed: "destructive",
};

export default function BuildsPage() {
  const [dashboardBuilds, setDashboardBuilds] = useState<DashboardBuild[]>([]);
  const [queueBuilds, setQueueBuilds] = useState<QueueBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    fetch("/api/builds")
      .then((res) => res.json())
      .then((data) => {
        setDashboardBuilds(Array.isArray(data.dashboardBuilds) ? data.dashboardBuilds : []);
        setQueueBuilds(Array.isArray(data.queueBuilds) ? data.queueBuilds : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <ScoutTabs />

      <div>
        <h1 className="text-2xl font-bold text-white">Builds</h1>
        <p className="text-slate-400 mt-1">Track builds from scouted opportunities</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        </div>
      ) : (
        <>
          {dashboardBuilds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Hammer className="h-10 w-10 mb-3 text-slate-500" />
                <p className="text-lg font-medium">No builds yet</p>
                <p className="text-sm mt-1">Send an opportunity to build from the Opportunities page</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {dashboardBuilds.map((build) => (
                <Link key={build.id} href={`/builds/${build.id}`}>
                  <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white">{build.projectName}</h3>
                          {build.opportunity && (
                            <p className="text-xs text-slate-500 mt-1">
                              from opportunity: {build.opportunity.title}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={statusVariant[build.status] ?? "secondary"}>
                              {build.status}
                            </Badge>
                            {build.deployUrl && (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                Deployed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-500">
                            {format(new Date(build.createdAt), "MMM d")}
                          </span>
                          {build.completedAt && (
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              Done {format(new Date(build.completedAt), "MMM d")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {queueBuilds.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 mb-3"
              >
                {showQueue ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                External Queue ({queueBuilds.length})
              </button>
              {showQueue && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {queueBuilds.map((build, i) => (
                    <Card key={i} className="border-slate-700/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white">
                              {build.name || build.projectName || `Build #${i + 1}`}
                            </h3>
                            {build.prompt && (
                              <p className="text-sm text-slate-400 mt-1 line-clamp-3">{build.prompt}</p>
                            )}
                          </div>
                          {build.status && (
                            <Badge variant={build.status === "active" ? "success" : "secondary"}>
                              {build.status}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
