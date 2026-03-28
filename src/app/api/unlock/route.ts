import { NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = "Apple@11";

// 🔑 MUST MATCH CLIENT KEY
const KEY = Buffer.from("12345678901234567890123456789012");

// 🔓 Decrypt incoming request
function decryptRequest(base64: string) {
    const buffer = Buffer.from(base64, "base64");

    const iv = buffer.subarray(0, 12);

    const encryptedWithTag = buffer.subarray(12);

    const authTag = encryptedWithTag.subarray(
        encryptedWithTag.length - 16
    );
    const encrypted = encryptedWithTag.subarray(
        0,
        encryptedWithTag.length - 16
    );

    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
}

// 🔐 Encrypt response
function encryptResponse(data: any) {
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, encrypted, authTag]);

    return combined.toString("base64");
}

// 🚀 API handler
export async function POST(req: Request) {
    try {
        const encryptedBody = await req.text();

        // 🔓 Step 1: decrypt
        const decrypted = decryptRequest(encryptedBody);

 const { passcode } = decrypted;

        // 🔐 Step 3: business logic
        let response;

        if (passcode === SECRET) {
            response = { success: true, message: "Access granted" };
        } else {
            response = { success: false, message: "Access denied" };
        }

        // 🔐 Step 4: encrypt response
        const encryptedResponse = encryptResponse(response);

        return new NextResponse(encryptedResponse, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
            },
        });

    } catch (err) {
        console.error("API ERROR:", err);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}