import { GoldRushClient, Chain } from "@covalenthq/client-sdk";

let _client: GoldRushClient | null = null;

export function getGoldRushClient(): GoldRushClient {
  if (!_client) {
    const key = process.env.GOLDRUSH_API_KEY;
    if (!key) throw new Error("GOLDRUSH_API_KEY is not set");
    _client = new GoldRushClient(key);
  }
  return _client;
}

export type { Chain };
