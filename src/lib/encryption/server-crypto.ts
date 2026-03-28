// Server-side encryption (using Node.js crypto)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class ServerEncryption {
  private static algorithm = 'aes-256-gcm';
  private static secretKey: Buffer | null = null;
  
  // Initialize with environment variable
  static init() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY not set in environment');
    }
    this.secretKey = Buffer.from(key, 'hex');
  }
  
  // Encrypt data for server-side storage/transmission
  static encrypt(data: any): { encrypted: string; iv: string; authTag: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.secretKey!, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);
    
    const authTag = (cipher as any).getAuthTag();
    
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }
  
  // Decrypt data
  static decrypt(encrypted: string, iv: string, authTag: string): any {
    const decipher = createDecipheriv(
      this.algorithm,
      this.secretKey!,
      Buffer.from(iv, 'base64')
    );
    (decipher as any).setAuthTag(Buffer.from(authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }
  
  // Generate a secure session key
  static generateSessionKey(): string {
    return randomBytes(32).toString('hex');
  }
}

// Initialize on import
ServerEncryption.init();