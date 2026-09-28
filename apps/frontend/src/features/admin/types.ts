export type RoleRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { users: number };
};

export type UserRecord = {
  id: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  role: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
};

export type LoginLog = {
  id: string;
  status: "SUCCESS" | "FAILED";
  ipAddress: string | null;
  createdAt: string;
};
