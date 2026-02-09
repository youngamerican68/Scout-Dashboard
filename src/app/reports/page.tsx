"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ScoutTabs, useScout } from "@/components/scout-tabs";

interface Report {
  id: string;
  source: string;
  date: string;
  title: string;
  content: string;
  tweetCount: number | null;
  _count: { opportunities: number };
}

export default function ReportsPage() {
  const router = useRouter();
  const { sourceFilter, labels, scout } = useScout();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this report and all its opportunities?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {}
    setDeleting(null);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("source", sourceFilter);
    fetch(`/api/reports?${params}`)
      .then((res) => res.json())
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, sourceFilter]);

  return (
    <div className="space-y-6">
      <ScoutTabs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scout Reports</h1>
          <p className="text-slate-400 mt-1">Daily reports from Clawdbot&apos;s {labels.description}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="h-10 w-10 mb-3 text-slate-500" />
            <p className="text-lg font-medium">No reports yet</p>
            <p className="text-sm mt-1">Scout reports will appear here once ingested</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:border-slate-600 transition-colors cursor-pointer" onClick={() => router.push(`/reports/${report.id}?scout=${scout}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate">{report.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{report.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.date.replace("T00:00:00.000Z", "T12:00:00.000Z")), "MMM d, yyyy")}
                      </span>
                      <Badge variant="secondary">{report.source}</Badge>
                      {report.tweetCount != null && report.tweetCount > 0 && (
                        <span>{report.tweetCount} {labels.itemLabel}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="default">
                      {report._count.opportunities} opp{report._count.opportunities !== 1 ? "s" : ""}
                    </Badge>
                    <button
                      onClick={(e) => deleteReport(e, report.id)}
                      disabled={deleting === report.id}
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
