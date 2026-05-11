const _isServer = typeof window === "undefined";

function apiBase(): string {
  return _isServer ? (process.env.NEXT_PUBLIC_API_URL || "") : "/api/vcs";
}

function serverKey(): Record<string, string> {
  if (!_isServer) return {};
  const k = process.env.BACKEND_API_KEY;
  return k ? { "X-API-Key": k } : {};
}

const PUBLIC_PROXY_BASE = "/api/public";

function viaPublicProxy(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${PUBLIC_PROXY_BASE}/${normalized}`;
}

export class ApiError extends Error {
  code?: string;
  retryable?: boolean;
  status?: number;

  constructor(message: string, opts?: { code?: string; retryable?: boolean; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.retryable = opts?.retryable;
    this.status = opts?.status;
  }
}

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  let payload: { message?: string; code?: string; retryable?: boolean } | undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  throw new ApiError(payload?.message || fallbackMessage, {
    code: payload?.code,
    retryable: payload?.retryable,
    status: response.status,
  });
}

export interface WaitlistRequest {
  email: string;
  referralCode?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
}

export async function joinWaitlist(data: WaitlistRequest): Promise<WaitlistResponse> {
  const response = await fetch(`${apiBase()}/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to join waitlist");
  }

  return response.json();
}

// Auth types
export interface AuthExistsRequest {
  email: string;
}

export interface AuthExistsResponse {
  exists: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    vant_id: string;
    email: string;
    username: string;
    balance_id: string;
    profile_image_url?: string;
  };
}

export interface AuthUsernameRequest {
  username: string;
  email: string;
}

export interface AuthUsernameResponse {
  success: boolean;
  message: string;
  user: {
    vant_id: string;
    email: string;
    username: string;
    balance_id: string;
  };
}

export interface AuthUsernameExistsResponse {
  exists: boolean;
}

// Auth API functions
export async function checkEmailExists(email: string): Promise<AuthExistsResponse> {
  const response = await fetch(`${apiBase()}/auth/exists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...serverKey()
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to check email");
  }

  return response.json();
}

export async function checkUsernameExists(username: string): Promise<AuthUsernameExistsResponse> {
  const response = await fetch(`${apiBase()}/auth/username/exists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...serverKey()
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error("Failed to check username");
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBase()}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...serverKey()
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to login");
  }

  return response.json();
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBase()}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...serverKey()
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to signup");
  }

  return response.json();
}

export async function setUsername(username: string, email: string, token: string): Promise<AuthUsernameResponse> {
  const response = await fetch(`${apiBase()}/auth/username`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify({ username, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to set username");
  }

  return response.json();
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(`${apiBase()}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
}

// Price types
export interface PriceUpdate {
  symbol: string;
  price: string;
  time: number;
}

export interface PriceData {
  BTC: PriceUpdate | null;
  ETH: PriceUpdate | null;
  SOL: PriceUpdate | null;
  USDC?: PriceUpdate | null;
  USDT?: PriceUpdate | null;
}

export interface VantRateResponse {
  success: boolean;
  buy_rate: number;
}

export interface AssetVantPriceResponse {
  success: boolean;
  asset: string;
  price: number;
}

export interface TokenPricesResponse {
  success: boolean;
  prices: Record<string, number>;
}

// Price API functions
export function connectToPriceFeed(
  token: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:8080/ws`;
  const authedWsUrl = `${wsUrl}?token=${token}`;

  try {
    const ws = new WebSocket(authedWsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse ws message:", err);
      }
    };

    ws.onerror = (error) => {
      console.warn("WebSocket error - will fallback to polling");
      onError?.(error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return ws;
  } catch (err) {
    console.warn("Failed to create WebSocket - will fallback to polling");
    onError?.(err as Event);
    return {} as WebSocket;
  }
}

export async function getLatestPrices(): Promise<PriceData> {
  const proxyResp = await fetch(viaPublicProxy("prices"), { method: "GET" });
  if (proxyResp.ok) {
    return proxyResp.json();
  }

  throw new Error("Failed to fetch prices");
}

export async function getVantRate(): Promise<VantRateResponse> {
  const response = await fetch(viaPublicProxy("prices/vant"), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Vant rates");
  }

  return response.json();
}

export async function getAssetVantPrice(asset: string): Promise<AssetVantPriceResponse> {
  const response = await fetch(viaPublicProxy(`prices/vant/${asset}`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Vant price for ${asset}`);
  }

  return response.json();
}

export async function getTokenPrices(tickers: string[]): Promise<TokenPricesResponse> {
  const query = encodeURIComponent(tickers.join(","));
  const response = await fetch(viaPublicProxy(`prices/tokens?tickers=${query}`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch token prices");
  }

  return response.json();
}

// Dashboard types
export interface UserProfile {
  vant_id: string;
  email: string;
  username: string;
  full_name?: string;
  balance_id: string;
  socials?: string[];
  profile_image_url?: string;
  created_at?: string;
}

export interface WalletDetails {
  sol_public_key: string;
  base_public_key: string;
  account_id: string;
}

export interface UserResponse {
  success: boolean;
  user: UserProfile;
  wallet: WalletDetails;
}

export interface BalanceInfo {
  id: string;
  email: string;
  total_usd: number;
  total_demo_usd: number;
  vusd: number;
  // Real assets
  pusd_sol?: number;
  usdc_sol: number;
  wsol: number;
  usdc_base: number;
  usdt_sol: number;
  usdg_sol: number;
  sol: number;
  eth_base: number;
  naira: number;
  // Demo assets
  demo_usdc_sol: number;
  demo_sol: number;
  demo_naira: number;
}

export interface BalanceResponse {
  success: boolean;
  balance: BalanceInfo;
}

export interface DemoFundResponse {
  success: boolean;
  message: string;
  tx_hash?: string;
}

export interface SellCryptoRequest {
  asset: string;
  amount: number;
  nature: "demo" | "real";
}

export interface SellCryptoResponse {
  success: boolean;
  message: string;
  usd_received: number;
  exchange_rate: number;
}

export interface Transaction {
  id: string;
  user_email: string;
  amount: number;
  currency: string;
  nature: string;
  type: string;
  status: string;
  tx_hash?: string;
  created_at: string;
}

export interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
}

// Dashboard API functions
export async function getUserProfile(token: string): Promise<UserResponse> {
  const response = await fetch(`${apiBase()}/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    return throwApiError(response, "Failed to fetch user profile");
  }

  return response.json();
}

export async function updateUserProfile(
  token: string,
  updates: Partial<Omit<UserProfile, 'vant_id' | 'balance_id'>>
): Promise<UserResponse> {
  const response = await fetch(`${apiBase()}/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
}

export async function uploadProfileImage(
  token: string,
  file: File
): Promise<{ success: boolean; profile_image_url: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${apiBase()}/user/profile-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload profile image");
  }

  return response.json();
}

export async function getBalance(token: string): Promise<BalanceResponse> {
  const response = await fetch(`${apiBase()}/balance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    return throwApiError(response, "Failed to fetch balance");
  }

  return response.json();
}

export async function syncBalance(token: string): Promise<BalanceResponse> {
  const response = await fetch(`${apiBase()}/balance/sync`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    return throwApiError(response, "Failed to sync balance");
  }

  return response.json();
}

export async function withdrawBalance(
  token: string,
  amount: number,
  destinationAddress: string,
  isDemo = false
): Promise<{ success: boolean; message: string; gross_amount: number; fee_amount: number; net_amount: number }> {
  const response = await fetch(`${apiBase()}/balance/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey(),
    },
    body: JSON.stringify({ amount, destination_address: destinationAddress, is_demo: isDemo }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Withdrawal failed");
  return data;
}

export async function withdrawAsset(
  token: string,
  asset: string,
  amount: number,
  destinationAddress: string
): Promise<{ success: boolean; message: string; asset: string; gross_amount: number; fee_amount: number; net_amount: number }> {
  const response = await fetch(`${apiBase()}/balance/withdraw/asset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey(),
    },
    body: JSON.stringify({ asset, amount, destination_address: destinationAddress }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Asset withdrawal failed");
  return data;
}

export async function fundDemoAccount(token: string, amount: number = 20000): Promise<DemoFundResponse> {
  const response = await fetch(`${apiBase()}/demo/fund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fund demo account");
  }

  return response.json();
}

export async function sellCrypto(token: string, data: SellCryptoRequest): Promise<SellCryptoResponse> {
  const response = await fetch(`${apiBase()}/balance/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sell crypto");
  }

  return response.json();
}

export async function getTransactions(token: string): Promise<TransactionsResponse> {
  const response = await fetch(`${apiBase()}/transactions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const data = await response.json();
  return {
    ...data,
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
  };
}


export async function closePosition(marketId: string, token: string, positionId: string, data: SellPositionRequest): Promise<SellPositionResponse> {
  const response = await fetch(`${apiBase()}/markets/${marketId}/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    return throwApiError(response, "Failed to close position");
  }

  return response.json();

}

// Markets types
export type MarketType = "CAPPM" | "GEM";
export type MarketStatus = "active" | "resolved";
export type MarketDirection = "Above" | "Below";
export type MarketOutcome = "YES" | "NO";

export interface Market {
  id: string;
  market_type: MarketType;
  status: MarketStatus;
  quote_currency: string;
  title: string;
  description: string;
  data_provider: string;
  creator_address: string;
  market_pda: string;
  start_time_utc: string;
  end_time_utc: string;
  duration_seconds: number;
  created_at: string;
  creation_tx_hash: string;
  asset?: string;
  direction?: MarketDirection;
  target_price?: number;
  current_price?: number;
  outcome?: MarketOutcome;
  outcome_description?: string;
  end_price?: number;
  settlement_tx_hash?: string;
  resolved_at?: string;
  market_image_small?: string;
  market_image_banner?: string;
  category?: string;
}

export interface MarketsResponse {
  success: boolean;
  markets: Market[];
  count: number;
}

export interface MarketResponse {
  success: boolean;
  market: Market;
}

export interface OnchainMarket {
  MarketID: string;
  MarketType: number;
  IsResolved: boolean;
  Creator: string;
  ApprovedSettler: string;
  Title: string;
  Description: string;
  StartTimeUTC: number;
  EndTimeUTC: number;
  DurationSeconds: number;
  DataProvider: string;
  CreatedAt: number;
  Asset: string;
  Direction: number | null;
  TargetPrice: number | null;
  CurrentPrice: number | null;
  EndPrice: number | null;
  Outcome: number | null;
  OutcomeDescription: string;
}

export interface MarketOnchainResponse {
  success: boolean;
  market: Market;
  onchain: OnchainMarket;
  explorer_urls: {
    creation: string;
    settlement: string;
    account: string;
  };
}

export interface MarketsOnchainResponse {
  success: boolean;
  markets: OnchainMarket[];
  count: number;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderbookSnapshot {
  market_id: string;
  yes_bids: OrderbookLevel[];
  yes_asks: OrderbookLevel[];
  no_bids: OrderbookLevel[];
  no_asks: OrderbookLevel[];
  last_traded_price: number;
  spread: number;
  fetched_at: string;
}

export interface OrderbookResponse {
  success: boolean;
  orderbook: OrderbookSnapshot;
}

export type OrderSide = "YES" | "NO";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";

export interface Order {
  id: string;
  user_email: string;
  market_id: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  filled_qty: number;
  remaining_qty: number;
  status: OrderStatus;
  quote_currency: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  count: number;
}

export interface PlaceOrderRequest {
  market_id: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  quantity: number;
  is_demo: boolean;
  expires_at?: number;
}

export interface PlaceOrderResponse {
  success: boolean;
  order: Order;
}

export interface Position {
  id: string;
  user_email: string;
  market_id: string;
  side: OrderSide;
  shares: number;
  avg_entry_price: number;
  total_cost: number;
  realized_pnl: number;
  status: string;
  quote_currency: string;
  created_at: string;
  settled_at?: string;
  payout_amount: number;
}

export interface PositionsResponse {
  success: boolean;
  positions: Position[];
  count: number;
}

export interface SellPositionResponse {
  success: boolean;
  position: Position;
  proceeds: number;
}

export interface SellPositionRequest{
  position_id: string,
  shares: number,
}

export interface Trades {
  id: string;
  side: string;
  price: number;
  quantity: number;
  filled_at: string;
}
export interface TradesResponse {
  success: boolean;
  market_id: string;
  trades: Trades[];
  count: string;
}

export interface MarketVolume {
  market_id: string;
  trade_count: number;
  volume: number;
  yes_volume: number;
  no_volume: number;
  yes_volume_shares: number;
  no_volume_shares: number;
}

export interface MarketVolumeResponse {
  success: boolean;
  volume: MarketVolume;
}

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketCandlesResponse {
  success: boolean;
  market_id: string;
  interval_seconds: number;
  candles: MarketCandle[];
  count: number;
}

export interface MarketTrendPoint {
  time: number;
  yes_volume: number;
  no_volume: number;
}

export interface MarketOpinionTrendResponse {
  success: boolean;
  market_id: string;
  trend: MarketTrendPoint[];
  count: number;
}

// Markets API functions
export async function getTrades(
  id: string,
  limit: number = 10
): Promise<TradesResponse> {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());

  const response = await fetch(viaPublicProxy(`markets/${id}/trades?${params.toString()}`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }

  return response.json();
}

export async function getMarketVolume(id: string): Promise<MarketVolumeResponse> {
  const response = await fetch(viaPublicProxy(`markets/${id}/volume`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch market volume");
  }

  return response.json();
}

export async function getMarketCandles(id: string): Promise<MarketCandlesResponse> {
  const response = await fetch(viaPublicProxy(`markets/${id}/candles`), {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch market candles");
  }
  return response.json();
}

export async function getMarketOpinionTrend(id: string): Promise<MarketOpinionTrendResponse> {
  const response = await fetch(viaPublicProxy(`markets/${id}/opinion-trend`), {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch market opinion trend");
  }
  return response.json();
}

export async function getMarkets(
  type?: MarketType,
  status?: MarketStatus,
  asset?: string,
  limit: number = 50
): Promise<MarketsResponse> {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (status) params.append("status", status);
  if (asset) params.append("asset", asset);
  params.append("limit", limit.toString());

  const response = await fetch(viaPublicProxy(`markets?${params.toString()}`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }

  return response.json();
}

export async function getMarket(marketId: string): Promise<MarketResponse> {
  const response = await fetch(viaPublicProxy(`markets/${marketId}`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch market");
  }

  return response.json();
}

export async function getMarketOnchain(marketId: string): Promise<MarketOnchainResponse> {
  const response = await fetch(`${apiBase()}/markets/${marketId}/onchain`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch onchain market data");
  }

  return response.json();
}

export async function getMarketsOnchain(status?: MarketStatus): Promise<MarketsOnchainResponse> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);

  const response = await fetch(`${apiBase()}/markets/onchain?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch onchain markets");
  }

  return response.json();
}

export async function getOrderbook(marketId: string): Promise<OrderbookResponse> {
  const response = await fetch(viaPublicProxy(`markets/${marketId}/orderbook`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch orderbook");
  }

  return response.json();
}

export async function placeOrder(token: string, data: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  const response = await fetch(`${apiBase()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "Failed to place order");
  }

  return response.json();
}

export async function cancelOrder(token: string, orderId: string): Promise<void> {
  const response = await fetch(`${apiBase()}/orders/${orderId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    return throwApiError(response, "Failed to cancel order");
  }
}

export async function getUserOrders(token: string, marketId?: string): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (marketId) params.append("market_id", marketId);

  const response = await fetch(`${apiBase()}/orders?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }

  return response.json();
}

export async function getUserPositions(token: string, marketId?: string): Promise<PositionsResponse> {
  const params = new URLSearchParams();
  if (marketId) params.append("market_id", marketId);

  const response = await fetch(`${apiBase()}/positions?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }

  return response.json();
}

export function connectToOrderbookFeed(
  token: string,
  marketId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:8080/ws`;
  const authedWsUrl = `${wsUrl}/markets/${marketId}/orderbook?token=${token}`;
  const ws = new WebSocket(authedWsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("Failed to parse ws message:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onError?.(error);
  };

  ws.onclose = () => {
    console.log("Orderbook WebSocket connection closed");
  };

  return ws;
}


export interface vsEvents {
      id: string,
      title: string,
      description: string,
      creator_email: string,
      mode: vsEventsModes,
      threshold: number,
      stake_amount: number,
      participant_target: number,
      status: string,
      outcome: string,
      outcome_description: string,
      creation_tx_hash: string,
      settlement_tx_hash: string,
      chain_state: string,
      join_deadline_utc: string,
      resolve_deadline_utc: string,
      created_at: string,
      updated_at: string,
      resolved_at: string,
      participants: Participant[]
     
}

export type vsEventsModes = "mutual" | "consensus";
export interface vsCreateRequest {
  title: string;
  description: string;
  mode: vsEventsModes;
  threshold: number;
  stake_amount: number;
  participant_target: number;
  join_deadline_utc: number;
  resolve_deadline_utc: number;
  is_demo: boolean;
}

export interface vsCreateResponse {
  success: boolean;
  event: vsEvents;
}

export interface Participant{
  id: string;
  vs_event_id: string;
  user_email: string;
  locked_amount: number;
  joined_at: string;
  confirmation: string;
  confirmed_at: string;
}

export async function createVsEvent(token: string, data: vsCreateRequest): Promise<vsCreateResponse> {
  const response = await fetch(`${apiBase()}/vs/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create vs event");
  }

  return response.json();
}

export async function getVsEvents(token: string): Promise<{ success: boolean; events: vsEvents[] }> {
  const response = await fetch(`${apiBase()}/vs/events`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vs events");
  }

  return response.json();
}

export async function fetchEventById(token: string, eventId: string): Promise<{ success: boolean; event: vsEvents }> {
  const response = await fetch(`${apiBase()}/vs/events/${eventId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vs event");
  }

  return response.json();
}

export async function joinVsEvent(token: string, eventId: string): Promise<{ success: boolean; participant: Participant }> {
  const response = await fetch(`${apiBase()}/vs/events/${eventId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });

  if (!response.ok) {
    throw new Error("Failed to join vs event");
  }

  return response.json();
}


export async function confirmVsEventOutcome(token: string, eventId: string, outcome: "YES" | "NO"): Promise<{ success: boolean; event: vsEvents }> {
  const response = await fetch(`${apiBase()}/vs/events/${eventId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
    body: JSON.stringify({ outcome }),
  });

  if (!response.ok) {
    throw new Error("Failed to confirm vs event outcome");
  }

  return response.json();
}

export async function cancelVsEvent(token: string, eventId: string): Promise<{ success: boolean; message: string }> {

  const response = await fetch(`${apiBase()}/vs/events/${eventId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...serverKey()
    },
  });
  if (!response.ok) {
    throw new Error("Failed to confirm vs event outcome");
  }

  return response.json();
}


export type Confirmation = 'YES' | 'NO' 
