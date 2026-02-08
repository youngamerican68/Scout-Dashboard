"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { Markdown } from "@/components/markdown";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  updatedAt: string;
}

interface Report {
  id: string;
  source: string;
  date: string;
  title: string;
  content: string;
  tweetCount: number | null;
  opportunities: Opportunity[];
}

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary"> = {
  new: "default",
  in_progress: "warning",
  done: "success",
  dismissed: "secondary",
};

const priorityVariant: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setReport(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/reports")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports
        </Button>
        <p className="text-slate-400">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/reports")} className="text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-white">{report.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(report.date), "MMMM d, yyyy")}
          </span>
          <Badge variant="secondary">{report.source}</Badge>
          {report.tweetCount != null && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {report.tweetCount} posts scanned
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Markdown content={report.content} className="text-slate-300 leading-relaxed" />
        </CardContent>
      </Card>

      {report.opportunities.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Opportunities ({report.opportunities.length})
          </h2>
          <div className="space-y-3">
            {report.opportunities.map((opp) => (
              <Card key={opp.id} className="hover:border-slate-600 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white">{opp.title}</h3>
                      {opp.description && (
                        <Markdown content={opp.description} className="text-sm text-slate-400 mt-1" />
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant={statusVariant[opp.status] ?? "secondary"}>
                          {opp.status.replace("_", " ")}
                        </Badge>
                        <Badge variant={priorityVariant[opp.priority] ?? "secondary"}>
                          {opp.priority}
                        </Badge>
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
        </div>
      )}
    </div>
  );
}
