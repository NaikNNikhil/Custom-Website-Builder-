-- CreateTable
CREATE TABLE "published_versions" (
    "id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_user_id" UUID,

    CONSTRAINT "published_versions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "websites" ADD COLUMN "current_published_version_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "published_versions_website_id_version_key" ON "published_versions"("website_id", "version");

-- CreateIndex
CREATE INDEX "published_versions_website_id_idx" ON "published_versions"("website_id");

-- CreateIndex
CREATE UNIQUE INDEX "websites_current_published_version_id_key" ON "websites"("current_published_version_id");

-- AddForeignKey
ALTER TABLE "published_versions" ADD CONSTRAINT "published_versions_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "websites" ADD CONSTRAINT "websites_current_published_version_id_fkey" FOREIGN KEY ("current_published_version_id") REFERENCES "published_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
