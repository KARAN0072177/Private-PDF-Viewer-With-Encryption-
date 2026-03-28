import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    // ✅ FIX: await params
    const { name } = await context.params;

    const filePath = path.join(process.cwd(), "public", name);

    const file = fs.readFileSync(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",

        // ✅ allow iframe
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self';",
      },
    });
  } catch (err) {
    return new NextResponse("File not found", { status: 404 });
  }
}