// Obfuscate traffic patterns
export class TrafficObfuscator {
  private static readonly MIN_PADDING = 50;
  private static readonly MAX_PADDING = 500;

  // Add random padding to requests
  static obfuscateRequest(data: any): string {
    const payload = JSON.stringify(data);
    const paddingSize = Math.floor(
      Math.random() * (this.MAX_PADDING - this.MIN_PADDING) + this.MIN_PADDING
    );

    const padding = Array(paddingSize)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join('');

    return JSON.stringify({
      d: payload,
      p: padding,
      t: Date.now(),
      nonce: crypto.randomUUID(),
    });
  }

  // Remove padding from requests
  static deobfuscateRequest(obfuscated: any): any {
    try {
      // ✅ handle both string and object
      const parsed =
        typeof obfuscated === "string"
          ? JSON.parse(obfuscated)
          : obfuscated;

      return JSON.parse(parsed.d);
    } catch {
      return null;
    }
  }

  // Generate random timing delays
  static async randomDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Add noise traffic to blend in
  static startNoiseGeneration() {
    if (typeof window === 'undefined') return;

    const noiseInterval = setInterval(() => {
      // Fetch random CDN resources to create background traffic
      const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/react/package.json',
        'https://cdn.jsdelivr.net/npm/lodash/lodash.min.js',
        'https://fonts.googleapis.com/css2?family=Inter',
      ];

      const randomUrl = cdnUrls[Math.floor(Math.random() * cdnUrls.length)];

      // Fetch with no-cors to avoid affecting app state
      fetch(randomUrl, { mode: 'no-cors' }).catch(() => { });
    }, Math.random() * 30000 + 15000);

    // Store interval ID for cleanup
    (window as any).__noiseInterval = noiseInterval;
  }

  static stopNoiseGeneration() {
    if (typeof window !== 'undefined' && (window as any).__noiseInterval) {
      clearInterval((window as any).__noiseInterval);
    }
  }
}