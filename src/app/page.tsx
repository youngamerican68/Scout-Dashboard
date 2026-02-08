"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Lightbulb, Hammer, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface RecentReport {
  id: string;
  title: string;
  source: string;
  date: string;
  _count: { opportunities: number };
}

interface RecentOpportunity {
  id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
}

interface Stats {
  totalReports: number;
  totalOpportunities: number;
  activeBuildCount: number;
  totalTweetsScanned: number;
  reportsOverTime: { month: string; count: number }[];
  recentReports: RecentReport[];
  recentOpportunities: RecentOpportunity[];
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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data?.totalReports !== undefined ? data : null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Scout Reports",
      value: stats?.totalReports ?? 0,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/reports",
    },
    {
      title: "Opportunities",
      value: stats?.totalOpportunities ?? 0,
      icon: Lightbulb,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/opportunities",
    },
    {
      title: "Active Builds",
      value: stats?.activeBuildCount ?? 0,
      icon: Hammer,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/builds",
    },
    {
      title: "Posts Scanned",
      value: stats?.totalTweetsScanned ?? 0,
      icon: MessageSquare,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      href: "/metrics",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Overview of Clawdbot&apos;s daily scout intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:border-slate-600 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{card.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`${card.bg} rounded-lg p-2.5`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Latest Reports</CardTitle>
            <Link href="/reports" className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentReports && stats.recentReports.length > 0 ? (
              <div className="space-y-3">
                {stats.recentReports.map((report) => (
                  <Link key={report.id} href={`/reports/${report.id}`} className="block">
                    <div className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{report.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.date), "MMM d")}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{report.source}</Badge>
                        </div>
                      </div>
                      <Badge variant="default" className="text-[10px] shrink-0">
                        {report._count.opportunities} opp{report._count.opportunities !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No reports yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Active Opportunities</CardTitle>
            <Link href="/opportunities" className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentOpportunities && stats.recentOpportunities.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOpportunities.map((opp) => (
                  <div key={opp.id} className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{opp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusVariant[opp.status] ?? "secondary"} className="text-[10px] px-1.5 py-0">
                          {opp.status.replace("_", " ")}
                        </Badge>
                        <Badge variant={priorityVariant[opp.priority] ?? "secondary"} className="text-[10px] px-1.5 py-0">
                          {opp.priority}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {format(new Date(opp.updatedAt), "MMM d")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No active opportunities</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Reports Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.reportsOverTime && stats.reportsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.reportsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Reports"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              No report data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
