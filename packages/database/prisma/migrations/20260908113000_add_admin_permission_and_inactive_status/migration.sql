-- Keep existing user records intact while aligning the persisted status name
-- with the public ACTIVE / INACTIVE contract.
ALTER TYPE "UserStatus" RENAME VALUE 'DISABLED' TO 'INACTIVE';

CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- This is the sole authorization capability required today. It deliberately
-- lives in the database so renaming the admin role does not change access.
INSERT INTO "permissions" ("id", "code")
VALUES ('00000000-0000-0000-0000-000000000003', 'admin:access');

INSERT INTO "role_permissions" ("role_id", "permission_id")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003'
);
