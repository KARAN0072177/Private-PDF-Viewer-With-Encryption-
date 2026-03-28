export class ClientEncryption {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  // 🔑 STATIC HELPERS (needed by KeyManager)
  static async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async importKey(base64Key: string): Promise<CryptoKey> {
    const raw = this.base64ToArrayBuffer(base64Key);
    return crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async exportKey(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey("raw", key);
    return this.arrayBufferToBase64(raw);
  }

  // 🔐 ENCRYPT
  async encrypt(data: any, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = this.encoder.encode(JSON.stringify(data));

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return ClientEncryption.arrayBufferToBase64(combined.buffer);
  }

  // 🔓 DECRYPT
  async decrypt(payload: string, key: CryptoKey): Promise<any> {
    const buffer = ClientEncryption.base64ToArrayBuffer(payload);
    const bytes = new Uint8Array(buffer);

    const iv = bytes.slice(0, 12);
    const encrypted = bytes.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return JSON.parse(this.decoder.decode(decrypted));
  }

  // Helpers
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}