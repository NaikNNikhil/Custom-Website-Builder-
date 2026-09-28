"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { CustomerChrome } from "@/components/app/customer-chrome";
import { AppContent } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { websiteApi } from "@/features/websites/lib/api";

export default function CustomerDashboardPage() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => websiteApi.listOrganizations({ accessToken: accessToken as string }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (organizationName: string) => {
      if (!accessToken) throw new Error("Authentication required");
      return websiteApi.createOrganization({ name: organizationName }, { accessToken });
    },
    onSuccess: async () => {
      setName("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create organization");
    },
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
  }

  if (user.permissions.includes("admin:access")) {
    redirect("/dashboard/admin");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }
    createMutation.mutate(name.trim());
  }

  return (
    <CustomerChrome>
      <AppContent width="md">
        <PageHeader
          eyebrow="Customer"
          title="Organizations"
          description="Create and open organizations that own your websites."
        />

        <Card>
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>Start a workspace for websites and members.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Acme Studio"
                  aria-label="Organization name"
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create organization"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Your organizations</h2>
          {organizationsQuery.isError ? (
            <p className="text-sm text-destructive">Unable to load organizations.</p>
          ) : null}
          {organizationsQuery.data?.organizations.length ? (
            <ul className="space-y-3">
              {organizationsQuery.data.organizations.map((organization) => (
                <li key={organization.id}>
                  <Link
                    href={`/dashboard/customer/orgs/${organization.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-secondary/40"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 rounded-lg bg-secondary p-2 text-primary">
                        <Building2 className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{organization.name}</p>
                        <p className="text-sm text-muted-foreground">/{organization.slug}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{organization.membershipRole}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Card size="sm">
              <CardContent className="py-6 text-sm text-muted-foreground">
                No organizations yet. Create one to get started.
              </CardContent>
            </Card>
          )}
        </section>
      </AppContent>
    </CustomerChrome>
  );
}
