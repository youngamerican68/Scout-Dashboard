"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hammer } from "lucide-react";

interface Build {
  name?: string;
  projectName?: string;
  status?: string;
  prompt?: string;
  [key: string]: unknown;
}

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/builds")
      .then((res) => res.json())
      .then((data) => setBuilds(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Builds</h1>
        <p className="text-slate-400 mt-1">Active builds in the queue</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        </div>
      ) : builds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Hammer className="h-10 w-10 mb-3 text-slate-500" />
            <p className="text-lg font-medium">No active builds</p>
            <p className="text-sm mt-1">The build queue is empty</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {builds.map((build, i) => (
            <Card key={i} className="hover:border-slate-600 transition-colors">
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
  );
}
