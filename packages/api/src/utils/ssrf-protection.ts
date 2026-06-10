import dns from "node:dns/promises";

function isPrivateIp(ip: string): boolean {
  if (ip === "0.0.0.0") return true;

  // IPv6 loopback and unspecified
  if (ip === "::1" || ip === "::") return true;

  // Simple IPv4 matching
  const parts = ip.split(".");
  if (parts.length === 4) {
    const num0 = parseInt(parts[0] as string, 10);
    const num1 = parseInt(parts[1] as string, 10);

    // 10.0.0.0/8
    if (num0 === 10) return true;

    // 127.0.0.0/8
    if (num0 === 127) return true;

    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (num0 === 172 && num1 >= 16 && num1 <= 31) return true;

    // 192.168.0.0/16
    if (num0 === 192 && num1 === 168) return true;

    // 169.254.0.0/16
    if (num0 === 169 && num1 === 254) return true;
  }

  // IPv4-mapped IPv6 e.g., ::ffff:127.0.0.1
  if (ip.startsWith("::ffff:")) {
    return isPrivateIp(ip.substring(7));
  }

  return false;
}

export async function validateUrl(urlStr: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error("SSRF attempt blocked: Invalid URL");
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("SSRF attempt blocked: Only HTTP/HTTPS protocols are allowed");
  }

  const hostname = parsed.hostname;

  // Reject simple localhost strings
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    throw new Error("SSRF attempt blocked: Private or local IP addresses are not allowed");
  }

  try {
    // dns.lookup defaults to throwing if it can't resolve
    const lookup = await dns.lookup(hostname);
    if (isPrivateIp(lookup.address)) {
      throw new Error("SSRF attempt blocked: Private or local IP addresses are not allowed");
    }
  } catch (err: any) {
    if (err.message && err.message.includes("SSRF")) {
      throw err;
    }
    throw new Error("SSRF attempt blocked: Could not resolve hostname");
  }
}

export async function secureFetch(url: string, init?: RequestInit): Promise<Response> {
  await validateUrl(url);
  return fetch(url, init);
}
