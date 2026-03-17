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
