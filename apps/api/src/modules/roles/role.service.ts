import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { normalizeRoleName } from "./role.utils";

export const roleNameSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters long").max(120, "Role name is too long"),
});

export const roleService = {
  async ensureSystemRoles(): Promise<void> {
    const defaultRoles = ["admin", "customer"];

    for (const roleName of defaultRoles) {
      const normalizedName = normalizeRoleName(roleName);

      await database.role.upsert({
        where: { name: normalizedName },
        update: {},
        create: { name: normalizedName },
      });
    }
  },

  async getAllRoles() {
    return database.role.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
  },

  async createRole(input: { name: string }) {
    const name = normalizeRoleName(input.name);
    const parsed = roleNameSchema.parse({ name });

    const exists = await database.role.findUnique({ where: { name: parsed.name } });
    if (exists) {
      throw new AppError(409, "Role already exists");
    }

    return database.role.create({
      data: {
        id: randomUUID(),
        name: parsed.name,
      },
    });
  },

  async updateRole(id: string, input: { name: string }) {
    const name = normalizeRoleName(input.name);
    const parsed = roleNameSchema.parse({ name });

    const role = await database.role.findUnique({ where: { id } });
    if (!role) {
      throw new AppError(404, "Role not found");
    }

    const duplicate = await database.role.findUnique({ where: { name: parsed.name } });
    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, "Role already exists");
    }

    return database.role.update({
      where: { id },
      data: { name: parsed.name },
    });
  },

  async deleteRole(id: string) {
    const role = await database.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      throw new AppError(404, "Role not found");
    }

    if (role._count.users > 0) {
      throw new AppError(409, "Cannot delete this role because users are assigned to it.");
    }

    await database.role.delete({ where: { id } });
    return { success: true };
  },

  async getRoleByName(name: string) {
    return database.role.findUnique({
      where: { name: normalizeRoleName(name) },
    });
  },
};
