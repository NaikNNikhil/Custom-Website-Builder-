import { apiRequest } from "@/features/auth/lib/api";
import type { LoginLog, RoleRecord, UserRecord } from "../types";

type RequestOptions = { accessToken: string };

export const adminApi = {
  listRoles: ({ accessToken }: RequestOptions) =>
    apiRequest<{ roles: RoleRecord[] }>("/api/roles", { method: "GET", accessToken }),
  createRole: (name: string, { accessToken }: RequestOptions) =>
    apiRequest<{ role: RoleRecord }>("/api/roles", { method: "POST", accessToken, body: JSON.stringify({ name }) }),
  updateRole: (id: string, name: string, { accessToken }: RequestOptions) =>
    apiRequest<{ role: RoleRecord }>(`/api/roles/${id}`, { method: "PATCH", accessToken, body: JSON.stringify({ name }) }),
  deleteRole: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean }>(`/api/roles/${id}`, { method: "DELETE", accessToken }),
  listUsers: ({ accessToken }: RequestOptions) =>
    apiRequest<{ users: UserRecord[] }>("/api/users", { method: "GET", accessToken }),
  getUser: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ user: UserRecord }>(`/api/users/${id}`, { method: "GET", accessToken }),
  updateUserRole: (id: string, roleId: string, { accessToken }: RequestOptions) =>
    apiRequest<{ user: UserRecord }>(`/api/users/${id}/role`, { method: "PATCH", accessToken, body: JSON.stringify({ roleId }) }),
  updateUserStatus: (id: string, status: UserRecord["status"], { accessToken }: RequestOptions) =>
    apiRequest<{ user: UserRecord }>(`/api/users/${id}/status`, { method: "PATCH", accessToken, body: JSON.stringify({ status }) }),
  getLoginLogs: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ logs: LoginLog[] }>(`/api/users/${id}/login-logs`, { method: "GET", accessToken }),
};
