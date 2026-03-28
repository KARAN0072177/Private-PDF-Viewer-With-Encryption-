import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const filePath = path.join(process.cwd(), "public", params.name);

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