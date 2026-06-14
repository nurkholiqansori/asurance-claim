export type UserRole = "user" | "verifier" | "approver";
export type ClaimStatus = "draft" | "submitted" | "reviewed" | "approved" | "rejected";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Claim {
  id: number;
  user_id: number;
  title: string;
  description: string;
  amount: number;
  status: ClaimStatus;
  created_at: string;
  updated_at: string;
}

export interface ClaimLog {
  id: number;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  actor_name: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
