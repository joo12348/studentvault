-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checksum" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploads_object_key_key" ON "uploads"("object_key");

-- CreateIndex
CREATE INDEX "uploads_uploader_id_idx" ON "uploads"("uploader_id");

-- CreateIndex
CREATE INDEX "uploads_status_idx" ON "uploads"("status");

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
