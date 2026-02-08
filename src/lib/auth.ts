import { NextRequest, NextResponse } from "next/server";

export function requireApiKey(request: NextRequest): NextResponse | null {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const provided =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!provided || provided !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // authorized
}
