"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Hammer, Lightbulb, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Markdown } from "@/components/markdown";

interface Build {
  id: string;
  projectName: string;
  status: string;
  prdContent: string | null;
  errorMessage: string | null;
  deployUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  opportunity: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    source: string;
  } | null;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  pending: "default",
  building: "warning",
  complete: "success",
  failed: "destructive",
};

export default function BuildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setBuild(data);
        if (data?.deployUrl) setDeployUrl(data.deployUrl);
        if (data?.errorMessage) setNotes(data.errorMessage);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const updateBuild = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/builds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setBuild(updated);
        if (updated.deployUrl) setDeployUrl(updated.deployUrl);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
      </div>
    );
  }

  if (!build) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/builds")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Builds
        </Button>
        <p className="text-slate-400">Build not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/builds")}
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Builds
      </Button>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{build.projectName}</h1>
          <Badge variant={statusVariant[build.status] ?? "secondary"} className="text-sm">
            {build.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Created {format(new Date(build.createdAt), "MMMM d, yyyy")}
          </span>
          {build.completedAt && (
            <span>Completed {format(new Date(build.completedAt), "MMMM d, yyyy")}</span>
          )}
        </div>
      </div>

      {/* Linked Opportunity */}
      {build.opportunity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Source Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-white">{build.opportunity.title}</h3>
            {build.opportunity.description && (
              <Markdown
                content={build.opportunity.description}
                className="text-sm text-slate-400 mt-1"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Status & Deploy URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Hammer className="h-4 w-4 text-emerald-400" />
            Build Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Status</label>
            <Select
              value={build.status}
              onChange={(e) => updateBuild({ status: e.target.value })}
              className="w-48"
              disabled={saving}
            >
              <option value="pending">Pending</option>
              <option value="building">Building</option>
              <option value="complete">Complete</option>
              <option value="failed">Failed</option>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Deploy URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={deployUrl}
                onChange={(e) => setDeployUrl(e.target.value)}
                placeholder="https://your-app.vercel.app"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateBuild({ deployUrl })}
                disabled={saving || deployUrl === (build.deployUrl ?? "")}
              >
                Save
              </Button>
              {build.deployUrl && (
                <a
                  href={build.deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 px-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes / Error</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this build..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateBuild({ errorMessage: notes })}
                disabled={saving || notes === (build.errorMessage ?? "")}
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRD Content */}
      {build.prdContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-base">PRD</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown content={build.prdContent} className="text-slate-300 leading-relaxed" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
