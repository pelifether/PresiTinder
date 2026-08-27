/**
 * Shared Upstash REST helper. Write paths only — nothing here reads keys
 * back to a client.
 */

export function redisCredentials(): { url: string; token: string } | null {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export async function redisPipeline(
  commands: (string | number)[][],
): Promise<{ result: unknown }[] | null> {
  const creds = redisCredentials();
  if (!creds) return null;
  const res = await fetch(`${creds.url}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${creds.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`upstash HTTP ${res.status}`);
  return (await res.json()) as { result: unknown }[];
}
