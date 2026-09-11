DROP INDEX "room_members_single_active_owner";

CREATE TYPE "RoomRole" AS ENUM ('member', 'owner');

ALTER TABLE "room_members"
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "role" TYPE "RoomRole" USING ("role"::text::"RoomRole"),
ALTER COLUMN "role" SET DEFAULT 'member';

CREATE UNIQUE INDEX "room_members_single_active_owner"
ON "room_members" ("room_id")
WHERE "role" = 'owner'::"RoomRole" AND "left_at" IS NULL;
