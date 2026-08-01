-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "room_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
