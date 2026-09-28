-- CreateTable
CREATE TABLE "library_items" (
    "id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "category" VARCHAR(160),
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "nodes" ADD COLUMN "library_item_id" UUID,
ADD COLUMN "library_item_version" INTEGER,
ADD COLUMN "library_node_key" VARCHAR(64);

-- CreateIndex
CREATE INDEX "library_items_website_id_idx" ON "library_items"("website_id");

-- CreateIndex
CREATE INDEX "library_items_website_id_category_idx" ON "library_items"("website_id", "category");

-- CreateIndex
CREATE INDEX "nodes_library_item_id_idx" ON "nodes"("library_item_id");

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
