import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const source = searchParams.get("source");

    const where: Record<string, unknown> = {};

    if (source) {
      const sources = source.split(",");
      where.source = sources.length > 1 ? { in: sources } : source;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        report: true,
      },
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    const opportunity = await prisma.opportunity.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        source: body.source ?? null,
        status: body.status ?? "new",
        priority: body.priority ?? "medium",
        notes: body.notes ?? null,
        reportId: body.reportId,
      },
      include: {
        report: true,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error("Failed to create opportunity:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
