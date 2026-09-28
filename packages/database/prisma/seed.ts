import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: "customer" },
    update: {},
    create: { name: "customer" },
  });

  const adminAccessPermission = await prisma.permission.upsert({
    where: { code: "admin:access" },
    update: {},
    create: { code: "admin:access" },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: adminAccessPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: adminAccessPermission.id,
    },
  });

  console.log(`Roles ready: admin=${adminRole.name}, customer=${customerRole.name}`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are not set. Skipping seeded admin creation.");
    return;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        roleId: adminRole.id,
        status: "ACTIVE",
      },
    });
    console.log(`Seed admin ensured: ${adminEmail}`);
    return;
  }

  const passwordHash = await import("bcrypt").then(({ default: bcrypt }) => bcrypt.hash(adminPassword, 12));

  const createdAdmin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      status: "ACTIVE",
      roleId: adminRole.id,
    },
  });

  console.log(`Seed admin created: ${createdAdmin.email}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
