import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const enabled = !!(UPSTASH_URL && UPSTASH_TOKEN);

const LEADERBOARD_KEY = "leaderboard:xp";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!enabled) return null;
  if (!_redis) {
    _redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  }
  return _redis;
}

export async function addXpScore(userId: string, score: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.zadd(LEADERBOARD_KEY, { score, member: userId });
}

export async function incrementXpScore(userId: string, increment: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.zincrby(LEADERBOARD_KEY, increment, userId);
}

export interface LeaderboardEntry {
  userId: string;
  xp: number;
  rank: number;
}

export async function getTopEntries(limit = 100): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  const raw = await redis.zrange(LEADERBOARD_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({
      userId: raw[i] as string,
      xp: Number(raw[i + 1]),
      rank: entries.length + 1,
    });
  }
  return entries;
}

export async function getUserRank(
  userId: string,
): Promise<{ rank: number; xp: number } | null> {
  const redis = getRedis();
  if (!redis) return null;

  const [rank, xp] = await Promise.all([
    redis.zrevrank(LEADERBOARD_KEY, userId),
    redis.zscore(LEADERBOARD_KEY, userId),
  ]);

  if (rank === null) return null;
  return { rank: rank + 1, xp: Number(xp ?? 0) };
}

export async function resetLeaderboard(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(LEADERBOARD_KEY);
}
