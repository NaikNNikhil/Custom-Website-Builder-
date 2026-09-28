"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppContent } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/providers/auth-provider";

export default function AdminRolesPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rolesQuery = useAdminQuery(["admin", "roles"], (token) =>
    adminApi.listRoles({ accessToken: token }),
  );
  const mutation = useMutation({
    mutationFn: async ({
      action,
      id,
      value,
    }: {
      action: "create" | "update" | "delete";
      id?: string;
      value?: string;
    }) => {
      if (!accessToken) throw new Error("Authentication required");
      if (action === "create") return adminApi.createRole(value ?? "", { accessToken });
      if (action === "update") return adminApi.updateRole(id ?? "", value ?? "", { accessToken });
      return adminApi.deleteRole(id ?? "", { accessToken });
    },
    onSuccess: () => {
      setError(null);
      setName("");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (requestError) =>
      setError(requestError instanceof Error ? requestError.message : "Unable to update roles."),
  });

  return (
    <AppContent width="lg">
      <PageHeader
        eyebrow="Masters"
        title="Roles"
        description="Define application roles available for user assignment."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add role</CardTitle>
          <CardDescription>Role names should be clear and unique.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim().length >= 2) mutation.mutate({ action: "create", value: name });
            }}
          >
            <div className="w-full max-w-xs space-y-1.5">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Manager"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending || name.trim().length < 2}>
              Add role
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {rolesQuery.isError ? <p className="text-sm text-destructive">Unable to load roles.</p> : null}

      <Card className="overflow-hidden p-0">
        <Table className="rounded-none border-0">
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rolesQuery.data?.roles.length ? (
              rolesQuery.data.roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {editing?.id === role.id ? (
                      <Input
                        value={editing.name}
                        onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                        className="max-w-xs"
                      />
                    ) : (
                      role.name
                    )}
                  </TableCell>
                  <TableCell>{role._count.users}</TableCell>
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {editing?.id === role.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            mutation.mutate({
                              action: "update",
                              id: role.id,
                              value: editing.name,
                            })
                          }
                          disabled={mutation.isPending}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing({ id: role.id, name: role.name })}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={role._count.users > 0 || mutation.isPending}
                          onClick={() => mutation.mutate({ action: "delete", id: role.id })}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No roles yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppContent>
  );
}
