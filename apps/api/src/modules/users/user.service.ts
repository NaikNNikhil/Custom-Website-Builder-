import { z } from "zod";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { normalizeRoleName } from "../roles/role.utils";

export const userRoleUpdateSchema = z.object({
  // PostgreSQL accepts the deterministic UUIDs used by the original migration,
  // even though they do not satisfy Zod's RFC-variant UUID refinement.
  roleId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Role ID is required"),
});

export const userStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status must be ACTIVE or INACTIVE" }),
});

const adminAccessPermission = "admin:access";

const hasAdminAccess = (role: { permissions: { permission: { code: string } }[] }) =>
  role.permissions.some(({ permission }) => permission.code === adminAccessPermission);

const userSelect = {
  id: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  loginLogs: {
    where: { status: "SUCCESS" as const },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { createdAt: true },
  },
} as const;

function toSafeManagedUser(user: { loginLogs: { createdAt: Date }[]; [key: string]: unknown }) {
  const { loginLogs, ...safeUser } = user;
  return {
    ...safeUser,
    lastLogin: loginLogs[0]?.createdAt ?? null,
  };
}

async function activeAdminCount() {
  return database.user.count({
    where: {
      status: "ACTIVE",
      role: { permissions: { some: { permission: { code: adminAccessPermission } } } },
    },
  });
}

export const userService = {
  async listUsers() {
    const users = await database.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    return users.map(toSafeManagedUser);
  },

  async getUserById(id: string) {
    const user = await database.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return toSafeManagedUser(user);
  },

  async updateRole(id: string, roleId: string) {
    const user = await database.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const targetRole = await database.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!targetRole) {
      throw new AppError(404, "Role not found");
    }

    if (user.status === "ACTIVE" && hasAdminAccess(user.role) && !hasAdminAccess(targetRole) && await activeAdminCount() <= 1) {
      throw new AppError(409, "Cannot remove the final active admin");
    }

    const updatedUser = await database.user.update({
      where: { id },
      data: { roleId },
      select: userSelect,
    });
    return toSafeManagedUser(updatedUser);
  },

  async updateStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    const user = await database.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (hasAdminAccess(user.role) && status === "INACTIVE" && await activeAdminCount() <= 1) {
      throw new AppError(409, "Cannot deactivate the final active admin");
    }

    const updatedUser = await database.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    });
    return toSafeManagedUser(updatedUser);
  },

  async getLoginLogs(userId: string) {
    const user = await database.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    return database.loginLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getCurrentUserRoleName(userId: string) {
    const user = await database.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return normalizeRoleName(user.role.name);
  },
};
