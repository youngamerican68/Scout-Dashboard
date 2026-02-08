import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.date = {};
      if (from) {
        (where.date as Record<string, unknown>).gte = new Date(from);
      }
      if (to) {
        (where.date as Record<string, unknown>).lte = new Date(to);
      }
    }

    const reports = await prisma.scoutReport.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        _count: {
          select: { opportunities: true },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    const report = await prisma.scoutReport.create({
      data: {
        source: body.source,
        date: new Date(body.date),
        title: body.title,
        content: body.content,
        tweetCount: body.tweetCount ?? 0,
        filePath: body.filePath ?? null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
