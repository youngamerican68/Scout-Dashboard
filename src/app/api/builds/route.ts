import { NextResponse } from "next/server";

export async function GET() {
  try {
    const queueUrl = process.env.QUEUE_URL;
    if (!queueUrl) return NextResponse.json([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(queueUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch builds from queue:", error);
    return NextResponse.json([]);
  }
}
