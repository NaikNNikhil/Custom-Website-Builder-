"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppContent } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const usersQuery = useAdminQuery(["admin", "users"], (token) =>
    adminApi.listUsers({ accessToken: token }),
  );
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserRecord["status"] }) => {
      if (!accessToken) throw new Error("Authentication required");
      return adminApi.updateUserStatus(id, status, { accessToken });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <AppContent width="xl">
      <PageHeader
        eyebrow="Masters"
        title="Users"
        description="Review accounts, roles, and activation status."
      />

      {usersQuery.isError || statusMutation.isError ? (
        <p className="text-sm text-destructive">
          {statusMutation.error instanceof Error
            ? statusMutation.error.message
            : "Unable to load users."}
        </p>
      ) : null}

      <Card className="overflow-hidden p-0">
        <Table className="rounded-none border-0">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.data?.users.length ? (
              usersQuery.data.users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>{item.role.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/admin/users/${item.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          id: item.id,
                          status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                      }
                    >
                      {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppContent>
  );
}
