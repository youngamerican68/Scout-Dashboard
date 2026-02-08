import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalReports, totalOpportunities, tweetAgg, reportsOverTime, activeBuildCount, recentReports, recentOpportunities] =
      await Promise.all([
        prisma.scoutReport.count(),

        prisma.opportunity.count(),

        prisma.scoutReport.aggregate({
          _sum: { tweetCount: true },
        }),

        getReportsOverTime(),

        fetchActiveBuildCount(),

        prisma.scoutReport.findMany({
          orderBy: { date: "desc" },
          take: 5,
          select: { id: true, title: true, source: true, date: true, _count: { select: { opportunities: true } } },
        }),

        prisma.opportunity.findMany({
          where: { status: { in: ["new", "in_progress"] } },
          orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
          take: 5,
          select: { id: true, title: true, status: true, priority: true, updatedAt: true },
        }),
      ]);

    const totalTweetsScanned = tweetAgg._sum.tweetCount ?? 0;

    return NextResponse.json({
      totalReports,
      totalOpportunities,
      activeBuildCount,
      totalTweetsScanned,
      reportsOverTime,
      recentReports,
      recentOpportunities,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

async function fetchActiveBuildCount(): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const queueUrl = process.env.QUEUE_URL;
    if (!queueUrl) return 0;

    const response = await fetch(queueUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return 0;

    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

async function getReportsOverTime() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const reports = await prisma.scoutReport.findMany({
    where: {
      date: { gte: sixMonthsAgo },
    },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  const months: { month: string; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = `${year}-${String(month + 1).padStart(2, "0")}`;

    const count = reports.filter((r) => {
      const rd = new Date(r.date);
      return rd.getFullYear() === year && rd.getMonth() === month;
    }).length;

    months.push({ month: label, count });
  }

  return months;
}
