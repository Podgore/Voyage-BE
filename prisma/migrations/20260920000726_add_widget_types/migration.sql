-- CreateIndex
CREATE INDEX "chat_messages_widget_id_idx" ON "chat_messages"("widget_id");

-- CreateIndex
CREATE INDEX "expense_shares_expense_id_idx" ON "expense_shares"("expense_id");

-- CreateIndex
CREATE INDEX "expenses_widget_id_idx" ON "expenses"("widget_id");

-- CreateIndex
CREATE INDEX "map_points_widget_id_idx" ON "map_points"("widget_id");

-- CreateIndex
CREATE INDEX "notes_widget_id_idx" ON "notes"("widget_id");

-- CreateIndex
CREATE INDEX "tasks_widget_id_idx" ON "tasks"("widget_id");

-- CreateIndex
CREATE INDEX "widgets_room_id_idx" ON "widgets"("room_id");
