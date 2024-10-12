import { Buffer } from "node:buffer";

const encoder = new TextEncoder();

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.byteLength !== bBytes.byteLength) {
    return false;
  }

  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { INTERNAL_BASIC_AUTH_PASSWORD, INTERNAL_BASIC_AUTH_USERNAME } = env;

    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      const headers = new Headers();
      headers.set(
        "WWW-Authenticate",
        'Basic realm="Access to DDNS service", charset="UTF-8"'
      );

      return new Response("Unauthorized", {
        status: 401,
        headers,
      });
    }

    const [scheme, encoded] = authorization.split(" ");

    if (!encoded || scheme !== "Basic") {
      return new Response("Malformed authorization header.", {
        status: 400,
      });
    }

    const credentials = Buffer.from(encoded, "base64").toString();

    const index = credentials.indexOf(":");
    const user = credentials.substring(0, index);
    const pass = credentials.substring(index + 1);

    if (
      !timingSafeEqual(INTERNAL_BASIC_AUTH_USERNAME, user) ||
      !timingSafeEqual(INTERNAL_BASIC_AUTH_PASSWORD, pass)
    ) {
      const headers = new Headers();
      headers.set(
        "WWW-Authenticate",
        'Basic realm="Access to DDNS service", charset="UTF-8"'
      );

      return new Response("You need to login.", {
        status: 401,
        headers,
      });
    }

    const params = new URL(request.url).searchParams;
    const myIp = params.get("myip");
    const hostname = params.get("hostname");

    if (!myIp || !hostname) {
      return new Response("Missing required parameters.", {
        status: 400,
      });
    }

    const CLOUDFLARE_API_KEY = env.CLOUDFLARE_API_KEY;
		const CLOUDFLARE_AUTH_EMAIL = env.CLOUDFLARE_AUTH_EMAIL;
    const CLOUDFLARE_ZONE_ID = env.CLOUDFLARE_ZONE_ID;
    const CLOUDFLARE_DNS_RECORD_ID = env.CLOUDFLARE_DNS_RECORD_ID;

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${CLOUDFLARE_API_KEY}`);
    headers.set("X-Auth-Email", CLOUDFLARE_AUTH_EMAIL);

    const body = JSON.stringify({
      type: "A",
      name: hostname,
      content: myIp,
      ttl: 3600,
      proxied: false,
      comment: `Updated by Cloudflare DDNS Worker: ${new Date().toISOString()}`,
      settings: {},
      tags: [],
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${CLOUDFLARE_DNS_RECORD_ID}`,
      {
        method: "PATCH",
        headers,
        body,
      }
    );

    if (!response.ok) {
      return new Response("Failed to update DNS record.", {
        status: 500,
      });
    }

    return new Response("DNS record updated.", {
      status: 200,
    });
  },
} satisfies ExportedHandler<Env>;
