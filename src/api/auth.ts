const API_URL = import.meta.env.VITE_API_URL;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  return response.json();
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

export async function registerUser(data: RegisterPayload) {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
}

export interface MeResponse {
  created_at: string;
  updated_at: string;

  id: string;
  email: string;
  full_name: string;

  role: string;

  is_active: boolean;
  is_verified: boolean;
}

export async function getMe(): Promise<MeResponse> {
  let token = localStorage.getItem("access_token");

  let response = await fetch(`${API_URL}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    token = await refreshAccessToken();

    response = await fetch(`${API_URL}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");

  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data: RefreshResponse = await response.json();

  localStorage.setItem("access_token", data.access_token);

  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }

  return data.access_token;
}
