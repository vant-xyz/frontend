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
}

// Price API functions
export function connectToPriceFeed(
  onPriceUpdate: (price: PriceUpdate) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:8080/ws`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const price: PriceUpdate = JSON.parse(event.data);
      onPriceUpdate(price);
    } catch (err) {
      console.error("Failed to parse price update:", err);
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

// Dashboard types
export interface UserProfile {
  vant_id: string;
  email: string;
  username: string;
  balance_id: string;
  profile_image_url?: string;
  wallets?: WalletInfo[];
}

export interface WalletInfo {
  asset: string;
  address: string;
  chain?: string;
}

export interface UserResponse {
  success: boolean;
  user: UserProfile;
}

export interface BalanceInfo {
  real: {
    total_ngn: number;
    assets: AssetBalance[];
  };
  demo: {
    total_ngn: number;
    assets: AssetBalance[];
  };
}

export interface AssetBalance {
  asset: string;
  amount: string;
  ngn_value: number;
}

export interface BalanceResponse {
  success: boolean;
  balance: BalanceInfo;
}

export interface DemoFundResponse {
  success: boolean;
  message: string;
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

export async function fundDemoAccount(token: string): Promise<DemoFundResponse> {
  const response = await fetch(`${API_BASE_URL}/demo/fund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fund demo account");
  }

  return response.json();
}
