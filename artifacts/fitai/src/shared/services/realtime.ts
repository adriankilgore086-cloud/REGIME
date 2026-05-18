import Ably from "ably";
import { useEffect, useRef } from "react";

const ABLY_KEY = process.env.EXPO_PUBLIC_ABLY_KEY ?? "";
const enabled = !!ABLY_KEY;

let client: Ably.Realtime | null = null;

function getClient(): Ably.Realtime | null {
  if (!enabled) return null;
  if (!client) {
    client = new Ably.Realtime({ key: ABLY_KEY, autoConnect: false });
  }
  return client;
}

export function connectRealtime(userId?: string) {
  if (!userId) return;
  const c = getClient();
  if (!c) return;
  c.connect();
}

export function disconnectRealtime() {
  client?.close();
  client = null;
}

export type RealtimeEvent =
  | { channel: "social:new-post"; data: unknown }
  | { channel: `notifications:${string}`; data: unknown }
  | { channel: "leaderboard:update"; data: unknown };

type ChannelName = RealtimeEvent["channel"];

export function useRealtimeChannel(
  channelName: ChannelName | null,
  onMessage: (data: unknown) => void,
) {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    if (!channelName || !enabled) return;
    const c = getClient();
    if (!c) return;

    const ch = c.channels.get(channelName);
    const listener = (msg: Ably.Message) => cbRef.current(msg.data);
    ch.subscribe(listener);

    return () => {
      ch.unsubscribe(listener);
    };
  }, [channelName]);
}

export function publishToChannel(channelName: string, data: unknown) {
  const c = getClient();
  if (!c) return;
  c.channels.get(channelName).publish("event", data).catch(console.warn);
}
