import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch dashboard builds from DB
    const dashboardBuilds = await prisma.build.findMany({
      orderBy: { createdAt: "desc" },
      include: { opportunity: true },
    });

    // Fetch external queue builds (existing QUEUE_URL system)
    let queueBuilds: unknown[] = [];
    const queueUrl = process.env.QUEUE_URL;
    if (queueUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(queueUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          queueBuilds = await response.json();
        }
      } catch {
        // Queue fetch failed, continue with empty
      }
    }

    return NextResponse.json({ dashboardBuilds, queueBuilds });
  } catch (error) {
    console.error("Failed to fetch builds:", error);
    return NextResponse.json({ dashboardBuilds: [], queueBuilds: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunityId } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
    }

    // Look up the opportunity
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Check if build already exists for this opportunity
    const existing = await prisma.build.findUnique({
      where: { opportunityId },
    });

    if (existing) {
      return NextResponse.json({ error: "Build already exists for this opportunity" }, { status: 409 });
    }

    // Create the build and update opportunity status in a transaction
    const build = await prisma.$transaction(async (tx) => {
      const newBuild = await tx.build.create({
        data: {
          projectName: opportunity.title,
          status: "pending",
          opportunityId,
        },
        include: { opportunity: true },
      });

      await tx.opportunity.update({
        where: { id: opportunityId },
        data: { status: "in_progress" },
      });

      return newBuild;
    });

    return NextResponse.json(build, { status: 201 });
  } catch (error) {
    console.error("Failed to create build:", error);
    return NextResponse.json({ error: "Failed to create build" }, { status: 500 });
  }
}
