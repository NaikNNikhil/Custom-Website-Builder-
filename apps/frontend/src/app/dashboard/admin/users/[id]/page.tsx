"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppContent } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/features/admin/lib/api";
import { useAdminQuery } from "@/features/admin/hooks/use-admin-query";
import type { UserRecord } from "@/features/admin/types";
import { useAuth } from "@/providers/auth-provider";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const userQuery = useAdminQuery(["admin", "users", params.id], (token) =>
    adminApi.getUser(params.id, { accessToken: token }),
  );
  const rolesQuery = useAdminQuery(["admin", "roles"], (token) =>
    adminApi.listRoles({ accessToken: token }),
  );
  const logsQuery = useAdminQuery(["admin", "users", params.id, "login-logs"], (token) =>
    adminApi.getLoginLogs(params.id, { accessToken: token }),
  );
  const mutation = useMutation({
    mutationFn: ({ kind, value }: { kind: "role" | "status"; value: string }) => {
      if (!accessToken) throw new Error("Authentication required");
      return kind === "role"
        ? adminApi.updateUserRole(params.id, value, { accessToken })
        : adminApi.updateUserStatus(params.id, value as UserRecord["status"], { accessToken });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
  const user = userQuery.data?.user;

  if (userQuery.isLoading) {
    return (
      <AppContent>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppContent>
    );
  }

  if (!user) {
    return (
      <AppContent>
        <p className="text-sm text-destructive">User not found.</p>
      </AppContent>
    );
  }

  return (
    <AppContent width="lg">
      <PageHeader
        eyebrow="Masters · Users"
        title={user.email}
        description="Manage role assignment and account status."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/admin/users")}>
            Back to users
          </Button>
        }
      />

      {mutation.isError ? (
        <p className="text-sm text-destructive">
          {mutation.error instanceof Error ? mutation.error.message : "Unable to update user."}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="user-role">Role</Label>
            <NativeSelect
              id="user-role"
              value={user.role.id}
              disabled={mutation.isPending}
              onChange={(event) => mutation.mutate({ kind: "role", value: event.target.value })}
            >
              {rolesQuery.data?.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                {user.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    kind: "status",
                    value: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  })
                }
              >
                {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last successful login</p>
            <p className="text-sm">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Login logs</h2>
        <Card className="overflow-hidden p-0">
          <Table className="rounded-none border-0">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.data?.logs.length ? (
                logsQuery.data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>{log.ipAddress ?? "Unknown"}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No login logs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </AppContent>
  );
}
