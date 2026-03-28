// DNS over HTTPS for domain privacy
export class DNSOverHTTPS {
  private static readonly DOH_ENDPOINTS = [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.quad9.net/dns-query',
  ];
  
  // Resolve domain using DoH
  static async resolveDomain(domain: string): Promise<string[]> {
    const endpoint = this.DOH_ENDPOINTS[0];
    
    try {
      const response = await fetch(`${endpoint}?name=${domain}&type=A`, {
        headers: {
          'Accept': 'application/dns-json',
        },
      });
      
      const data = await response.json();
      
      if (data.Answer) {
        return data.Answer
          .filter((record: any) => record.type === 1)
          .map((record: any) => record.data);
      }
      
      return [];
    } catch (error) {
      console.error('DoH resolution failed:', error);
      return [];
    }
  }
  
  // Cache resolved domains
  private static cache = new Map<string, { ips: string[]; timestamp: number }>();
  private static readonly CACHE_TTL = 300000; // 5 minutes
  
  static async getIP(domain: string): Promise<string[]> {
    const cached = this.cache.get(domain);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.ips;
    }
    
    const ips = await this.resolveDomain(domain);
    this.cache.set(domain, { ips, timestamp: Date.now() });
    
    return ips;
  }
}