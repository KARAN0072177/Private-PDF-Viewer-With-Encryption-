import { ClientEncryption } from "../encryption/client-crypto";
import { TrafficObfuscator } from "./traffic-obfuscator";
import { KeyManager } from "../encryption/key-manager";

export class SecureFetch {
  private static encryption = new ClientEncryption();
  private static keyManager = KeyManager.getInstance();

  static async post<T = any>(
    url: string,
    data: any,
    options?: RequestInit
  ): Promise<T> {
    const key = await this.keyManager.getClientKey();

    const encrypted = await this.encryption.encrypt(data, key);

    // ✅ STEP 3: Add timing noise
    await TrafficObfuscator.randomDelay(50, 200);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Session-ID": this.keyManager.sessionId || "",
      },
      body: encrypted,
    });

    const encryptedResponse = await response.text();

    if (!encryptedResponse) {
      throw new Error("Empty response");
    }

    // ✅ STEP 4: Decrypt
    const decrypted = await this.encryption.decrypt(
      encryptedResponse,
      key
    );

    return decrypted as T;
  }
}