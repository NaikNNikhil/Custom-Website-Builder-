import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

export type OrganizationMembership = {
  organizationId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export async function requireOrganizationMembership(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership> {
  const membership = await database.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      organizationId: true,
      role: true,
    },
  });

  if (!membership) {
    throw new AppError(403, "Forbidden");
  }

  return membership;
}

export async function resolveWebsiteOrganizationId(websiteId: string): Promise<string> {
  const website = await database.website.findUnique({
    where: { id: websiteId },
    select: { organizationId: true },
  });

  if (!website) {
    throw new AppError(404, "Website not found");
  }

  return website.organizationId;
}

export async function resolvePageAccess(pageId: string): Promise<{ pageId: string; websiteId: string; organizationId: string }> {
  const page = await database.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      websiteId: true,
      website: { select: { organizationId: true } },
    },
  });

  if (!page) {
    throw new AppError(404, "Page not found");
  }

  return {
    pageId: page.id,
    websiteId: page.websiteId,
    organizationId: page.website.organizationId,
  };
}

export async function resolveSectionAccess(sectionId: string): Promise<{
  sectionId: string;
  pageId: string;
  websiteId: string;
  organizationId: string;
}> {
  const section = await database.section.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      pageId: true,
      page: {
        select: {
          websiteId: true,
          website: { select: { organizationId: true } },
        },
      },
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  return {
    sectionId: section.id,
    pageId: section.pageId,
    websiteId: section.page.websiteId,
    organizationId: section.page.website.organizationId,
  };
}

export async function resolveNodeAccess(nodeId: string): Promise<{
  nodeId: string;
  sectionId: string;
  pageId: string;
  websiteId: string;
  organizationId: string;
}> {
  const node = await database.node.findUnique({
    where: { id: nodeId },
    select: {
      id: true,
      sectionId: true,
      section: {
        select: {
          pageId: true,
          page: {
            select: {
              websiteId: true,
              website: { select: { organizationId: true } },
            },
          },
        },
      },
    },
  });

  if (!node) {
    throw new AppError(404, "Node not found");
  }

  return {
    nodeId: node.id,
    sectionId: node.sectionId,
    pageId: node.section.pageId,
    websiteId: node.section.page.websiteId,
    organizationId: node.section.page.website.organizationId,
  };
}

export async function resolveLibraryItemAccess(libraryItemId: string): Promise<{
  libraryItemId: string;
  websiteId: string;
  organizationId: string;
}> {
  const item = await database.libraryItem.findUnique({
    where: { id: libraryItemId },
    select: {
      id: true,
      websiteId: true,
      website: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(404, "Library item not found");
  }

  return {
    libraryItemId: item.id,
    websiteId: item.websiteId,
    organizationId: item.website.organizationId,
  };
}
