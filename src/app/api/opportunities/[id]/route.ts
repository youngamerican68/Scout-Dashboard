import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        report: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.source !== undefined) data.source = body.source;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.reportId !== undefined) data.reportId = body.reportId;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data,
      include: {
        report: true,
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Failed to update opportunity:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    await prisma.opportunity.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Opportunity deleted" });
  } catch (error) {
    console.error("Failed to delete opportunity:", error);
    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
