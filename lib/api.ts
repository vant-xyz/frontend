const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface WaitlistRequest {
  email: string;
  referralCode?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
}

export async function joinWaitlist(data: WaitlistRequest): Promise<WaitlistResponse> {
  const response = await fetch(`${API_BASE_URL}/waitlist`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/exists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to check email");
  }

  return response.json();
}

export async function checkUsernameExists(username: string): Promise<AuthUsernameExistsResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/username/exists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error("Failed to check username");
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const response = await fetch(`${API_BASE_URL}/auth/username`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const response = await fetch(`${API_BASE_URL}/logout`, {
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
  NGN?: PriceUpdate | null;
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

// Price API functions
export function connectToPriceFeed(
  token: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:8080/ws`;
  const authedWsUrl = `${wsUrl}?token=${token}`;
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
    console.log("WebSocket connection closed");
  };

  return ws;
}

export async function getLatestPrices(): Promise<PriceData> {
  const response = await fetch(`${API_BASE_URL}/prices`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch prices");
  }

  return response.json();
}

export async function getVantRate(): Promise<VantRateResponse> {
  const response = await fetch(`${API_BASE_URL}/prices/vant`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Vant rates");
  }

  return response.json();
}

export async function getAssetVantPrice(asset: string): Promise<AssetVantPriceResponse> {
  const response = await fetch(`${API_BASE_URL}/prices/vant/${asset}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Vant price for ${asset}`);
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
  naira_account_number: string;
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
  total_naira: number;
  total_demo_naira: number;
  vnaira: number;
  // Real assets
  usdc_sol: number;
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
  naira_received: number;
  exchange_rate: number;
}

// Dashboard API functions
export async function getUserProfile(token: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

export async function updateUserProfile(
  token: string,
  updates: Partial<Omit<UserProfile, 'vant_id' | 'balance_id'>>
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

  const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload profile image");
  }

  return response.json();
}

export async function getBalance(token: string): Promise<BalanceResponse> {
  const response = await fetch(`${API_BASE_URL}/balance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch balance");
  }

  return response.json();
}

export async function syncBalance(token: string): Promise<BalanceResponse> {
  const response = await fetch(`${API_BASE_URL}/balance/sync`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to sync balance");
  }

  return response.json();
}

export async function fundDemoAccount(token: string, amount: number = 20000): Promise<DemoFundResponse> {
  const response = await fetch(`${API_BASE_URL}/demo/fund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const response = await fetch(`${API_BASE_URL}/balance/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sell crypto");
  }

  return response.json();
}
