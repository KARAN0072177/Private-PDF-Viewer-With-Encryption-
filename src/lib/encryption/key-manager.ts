import { ClientEncryption } from "./client-crypto";

export class KeyManager {
  private static instance: KeyManager;
  private clientKey: CryptoKey | null = null;
  public sessionId: string | null = null;

  private constructor() {}

  static getInstance(): KeyManager {
    if (!this.instance) {
      this.instance = new KeyManager();
    }
    return this.instance;
  }

  async initSession() {
    if (!this.sessionId) {
      this.sessionId = crypto.randomUUID();
    }

    // ⚠️ TEMP: fixed key (must match server)
    const rawKey = new TextEncoder().encode(
      "12345678901234567890123456789012"
    );

    this.clientKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async getClientKey(): Promise<CryptoKey> {
    if (!this.clientKey) {
      await this.initSession();
    }

    if (!this.clientKey) {
      throw new Error("Key not initialized");
    }

    return this.clientKey;
  }
}