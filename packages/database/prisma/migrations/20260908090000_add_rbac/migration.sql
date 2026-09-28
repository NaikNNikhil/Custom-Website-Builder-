-- CreateEnum
CREATE TYPE "LoginLogStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Create the system roles before assigning existing users.
INSERT INTO "roles" ("id", "name", "created_at", "updated_at")
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000002', 'customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Add the relation column as nullable while existing rows are backfilled.
ALTER TABLE "users" ADD COLUMN "role_id" UUID;

UPDATE "users"
SET "role_id" = '00000000-0000-0000-0000-000000000002'
WHERE "role_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "login_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "status" "LoginLogStatus" NOT NULL,
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_logs_user_id_idx" ON "login_logs"("user_id");
CREATE INDEX "login_logs_status_idx" ON "login_logs"("status");
CREATE INDEX "login_logs_created_at_idx" ON "login_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
