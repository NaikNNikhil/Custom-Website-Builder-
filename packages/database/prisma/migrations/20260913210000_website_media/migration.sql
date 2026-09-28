-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "url" VARCHAR(2048) NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "provider_id" VARCHAR(512) NOT NULL,
    "provider_meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_website_id_idx" ON "media_assets"("website_id");

-- CreateIndex
CREATE INDEX "media_assets_website_id_kind_idx" ON "media_assets"("website_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_website_id_provider_provider_id_key" ON "media_assets"("website_id", "provider", "provider_id");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
