export type AuthUser = {
  id: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  role: string;
  permissions: string[];
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  confirmPassword: string;
};
