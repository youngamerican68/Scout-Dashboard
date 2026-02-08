"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Lightbulb, MessageSquare, BookOpen, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ScoutTabs, useScout } from "@/components/scout-tabs";

interface Stats {
  totalReports: number;
  totalOpportunities: number;
  activeBuildCount: number;
  totalTweetsScanned: number;
  reportsOverTime: { month: string; count: number }[];
}

export default function MetricsPage() {
  const { sourceFilter, labels, scout } = useScout();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?source=${sourceFilter}`)
      .then((res) => res.json())
      .then((data) => setStats(data?.totalReports !== undefined ? data : null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sourceFilter]);

  if (loading) {
    return (
      <div>
        <ScoutTabs />
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        </div>
      </div>
    );
  }

  const conversionRate =
    stats && stats.totalReports > 0
      ? ((stats.totalOpportunities / stats.totalReports) * 100).toFixed(1)
      : "0";

  const avgItemsPerReport =
    stats && stats.totalReports > 0
      ? Math.round(stats.totalTweetsScanned / stats.totalReports)
      : 0;

  const scanIcon = scout === "journal" ? BookOpen : MessageSquare;

  const metricCards = [
    {
      title: "Total Reports",
      value: stats?.totalReports ?? 0,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Opportunities",
      value: stats?.totalOpportunities ?? 0,
      icon: Lightbulb,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Opps per Report",
      value: conversionRate + "%",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: `Avg ${labels.itemLabel} / Report`,
      value: avgItemsPerReport,
      icon: scanIcon,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <ScoutTabs />

      <div>
        <h1 className="text-2xl font-bold text-white">Metrics</h1>
        <p className="text-slate-400 mt-1">Clawdbot {labels.description} analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {typeof card.value === "number"
                      ? card.value.toLocaleString()
                      : card.value}
                  </p>
                </div>
                <div className={`${card.bg} rounded-lg p-2.5`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Reports by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.reportsOverTime && stats.reportsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.reportsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Report Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.reportsOverTime && stats.reportsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.reportsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.15}
                    name="Reports"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
