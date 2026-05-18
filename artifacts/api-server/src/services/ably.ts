import Ably from "ably";

const ABLY_API_KEY = process.env.ABLY_API_KEY ?? "";
const enabled = !!ABLY_API_KEY;

let _client: Ably.Rest | null = null;

function getClient(): Ably.Rest | null {
  if (!enabled) return null;
  if (!_client) {
    _client = new Ably.Rest({ key: ABLY_API_KEY });
  }
  return _client;
}

export async function publish(channelName: string, data: unknown): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.channels.get(channelName).publish("event", data);
  } catch (err) {
    console.warn("[Ably] publish error:", err);
  }
}
