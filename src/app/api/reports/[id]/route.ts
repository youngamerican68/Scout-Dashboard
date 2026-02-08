import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.scoutReport.findUnique({
      where: { id },
      include: {
        opportunities: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.source !== undefined) data.source = body.source;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.tweetCount !== undefined) data.tweetCount = body.tweetCount;
    if (body.filePath !== undefined) data.filePath = body.filePath;

    const report = await prisma.scoutReport.update({
      where: { id },
      data,
      include: {
        opportunities: true,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to update report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
