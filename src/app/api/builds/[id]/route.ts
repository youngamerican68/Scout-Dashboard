import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const build = await prisma.build.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    return NextResponse.json(build);
  } catch (error) {
    console.error("Failed to fetch build:", error);
    return NextResponse.json({ error: "Failed to fetch build" }, { status: 500 });
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
    if (body.status !== undefined) data.status = body.status;
    if (body.deployUrl !== undefined) data.deployUrl = body.deployUrl;
    if (body.errorMessage !== undefined) data.errorMessage = body.errorMessage;
    if (body.prdContent !== undefined) data.prdContent = body.prdContent;
    if (body.projectName !== undefined) data.projectName = body.projectName;

    // Set completedAt when marking complete or failed
    if (body.status === "complete" || body.status === "failed") {
      data.completedAt = new Date();
    }

    const build = await prisma.build.update({
      where: { id },
      data,
      include: { opportunity: true },
    });

    // If build is complete/failed, update the opportunity status too
    if (build.opportunityId && (body.status === "complete" || body.status === "failed")) {
      await prisma.opportunity.update({
        where: { id: build.opportunityId },
        data: { status: body.status === "complete" ? "done" : "new" },
      });
    }

    return NextResponse.json(build);
  } catch (error) {
    console.error("Failed to update build:", error);
    return NextResponse.json({ error: "Failed to update build" }, { status: 500 });
  }
}
