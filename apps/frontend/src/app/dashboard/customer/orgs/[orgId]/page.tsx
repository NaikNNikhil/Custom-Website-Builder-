"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { CustomerChrome } from "@/components/app/customer-chrome";
import { AppContent } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { websiteApi } from "@/features/websites/lib/api";

export default function OrganizationWebsitesPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const router = useRouter();
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const organizationQuery = useQuery({
    queryKey: ["organizations", orgId],
    queryFn: () => websiteApi.getOrganization(orgId, { accessToken: accessToken as string }),
    enabled: Boolean(accessToken && orgId),
  });

  const websitesQuery = useQuery({
    queryKey: ["organizations", orgId, "websites"],
    queryFn: () => websiteApi.listWebsites(orgId, { accessToken: accessToken as string }),
    enabled: Boolean(accessToken && orgId),
  });

  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: () => websiteApi.listTemplates({ accessToken: accessToken as string }),
    enabled: Boolean(accessToken),
  });

  const templates = templatesQuery.data?.templates ?? [];
  const selectedTemplateId =
    templateId && templates.some((item) => item.id === templateId)
      ? templateId
      : (templates[0]?.id ?? null);

  const createMutation = useMutation({
    mutationFn: (input: { websiteName: string; templateId: string }) => {
      if (!accessToken) throw new Error("Authentication required");
      return websiteApi.createWebsite(
        orgId,
        { name: input.websiteName, templateId: input.templateId },
        { accessToken },
      );
    },
    onSuccess: async (result) => {
      setName("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["organizations", orgId, "websites"] });
      router.push(`/dashboard/customer/orgs/${orgId}/websites/${result.website.id}/builder`);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create website");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (websiteId: string) => {
      if (!accessToken) throw new Error("Authentication required");
      return websiteApi.deleteWebsite(websiteId, { accessToken });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organizations", orgId, "websites"] });
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
      setError("Website name is required");
      return;
    }
    if (!selectedTemplateId) {
      setError("Select a template");
      return;
    }
    createMutation.mutate({ websiteName: name.trim(), templateId: selectedTemplateId });
  }

  return (
    <CustomerChrome>
      <AppContent width="lg">
        <PageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/customer">Organizations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {organizationQuery.data?.organization.name ?? "Organization"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          title={organizationQuery.data?.organization.name ?? "Organization"}
          description="Create websites from a starter template, then edit and publish in the builder."
        />

        <Card>
          <CardHeader>
            <CardTitle>Create website</CardTitle>
            <CardDescription>
              Choose a starting blueprint. After create, this website owns its own pages, theme,
              library, and media.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="website-name">Website name</Label>
                <Input
                  id="website-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Storefront"
                  aria-label="Website name"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in the builder and public site header.
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <Label>Template</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Structural starter only — not a marketplace.
                  </p>
                </div>
                {templatesQuery.isError ? (
                  <p className="text-sm text-destructive">Unable to load templates.</p>
                ) : null}
                <ul className="grid gap-3 sm:grid-cols-2">
                  {templates.map((template) => {
                    const selected = template.id === selectedTemplateId;
                    return (
                      <li key={template.id}>
                        <button
                          type="button"
                          onClick={() => setTemplateId(template.id)}
                          className={`relative flex h-full w-full flex-col rounded-xl border px-4 py-3.5 text-left transition-colors ${
                            selected
                              ? "border-primary bg-secondary shadow-[inset_0_0_0_1px_var(--primary)]"
                              : "border-border bg-card hover:border-primary/30 hover:bg-secondary/30"
                          }`}
                          aria-pressed={selected}
                        >
                          {selected ? (
                            <span className="absolute right-3 top-3 rounded-full bg-primary p-0.5 text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                          <span className="pr-6 text-sm font-semibold text-foreground">
                            {template.name}
                          </span>
                          <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {template.description}
                          </span>
                          <Badge variant="outline" className="mt-3 w-fit">
                            v{template.version}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={createMutation.isPending || templatesQuery.isLoading}>
                {createMutation.isPending ? "Creating…" : "Create website"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Websites</h2>
          {websitesQuery.isError || organizationQuery.isError ? (
            <p className="text-sm text-destructive">Unable to load websites for this organization.</p>
          ) : null}
          {websitesQuery.data?.websites.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {websitesQuery.data.websites.map((website) => (
                <li key={website.id}>
                  <Card className="h-full transition-colors hover:border-primary/25">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate">{website.name}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5">
                            <Globe className="size-3.5 shrink-0" />
                            <span className="truncate">/{website.slug}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs text-muted-foreground">
                      {website.templateId ? (
                        <p>
                          Template `{website.templateId}` · v{website.templateVersion}
                        </p>
                      ) : (
                        <p>No template metadata</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2 border-t-0 bg-transparent">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/customer/orgs/${orgId}/websites/${website.id}/builder`,
                          )
                        }
                      >
                        Open builder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/customer/orgs/${orgId}/websites/${website.id}`)
                        }
                      >
                        Structure
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(website.id)}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card size="sm">
              <CardContent className="py-6 text-sm text-muted-foreground">
                No websites yet. Create one above to open the builder.
              </CardContent>
            </Card>
          )}
        </section>
      </AppContent>
    </CustomerChrome>
  );
}
