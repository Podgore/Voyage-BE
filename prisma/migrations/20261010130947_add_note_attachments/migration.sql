-- AlterTable
ALTER TABLE "notes" ALTER COLUMN "text" DROP NOT NULL;

-- CreateTable
CREATE TABLE "note_attachments" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_attachments_note_id_idx" ON "note_attachments"("note_id");

-- AddForeignKey
ALTER TABLE "note_attachments" ADD CONSTRAINT "note_attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
