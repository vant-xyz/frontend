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
