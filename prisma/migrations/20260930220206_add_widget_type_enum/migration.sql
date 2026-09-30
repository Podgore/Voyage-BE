-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('CHAT', 'NOTES', 'TASKS', 'MAP', 'EXPENSES');

ALTER TABLE "widgets"
  ADD COLUMN "type_new" "WidgetType";

UPDATE "widgets"
SET "type_new" = CASE
  WHEN "type" = 'chat' THEN 'CHAT'::"WidgetType"
  WHEN "type" = 'notes' THEN 'NOTES'::"WidgetType"
  WHEN "type" = 'tasks' THEN 'TASKS'::"WidgetType"
  WHEN "type" = 'map' THEN 'MAP'::"WidgetType"
  WHEN "type" = 'expenses' THEN 'EXPENSES'::"WidgetType"
  ELSE NULL
END;

ALTER TABLE "widgets"
  DROP COLUMN "type";

ALTER TABLE "widgets"
  RENAME COLUMN "type_new" TO "type";

ALTER TABLE "widgets"
  ALTER COLUMN "type" SET NOT NULL;

CREATE UNIQUE INDEX "widgets_room_id_type_key"
  ON "widgets"("room_id", "type");