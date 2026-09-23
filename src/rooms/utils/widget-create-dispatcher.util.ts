import { Prisma } from '../../../generated/prisma/client';
import { WidgetType } from '../enums/widget-type.enum';
import type { WidgetCreateHandler } from '../types/widget-create-handler.type';
import type { WidgetCreatePayloadMap } from '../types/widget-create-payload-map.type';

type WidgetCreateHandlersMap = {
  [K in WidgetType]: WidgetCreateHandler<K>;
};

const createTaskPayload: WidgetCreateHandler<WidgetType.TASKS> = async (
  tx,
  widgetId,
  payload,
) => {
  await tx.task.create({
    data: {
      widgetId,
      createdById: payload.createdById,
      assignedToId: payload.assignedToId,
      title: payload.title,
      description: payload.description,
    },
  });
};

const createNotePayload: WidgetCreateHandler<WidgetType.NOTES> = async (
  tx,
  widgetId,
  payload,
) => {
  await tx.note.create({
    data: {
      widgetId,
      roomMemberId: payload.roomMemberId,
      text: payload.text,
    },
  });
};

const createChatPayload: WidgetCreateHandler<WidgetType.CHAT> = async (
  tx,
  widgetId,
  payload,
) => {
  await tx.chatMessage.create({
    data: {
      widgetId,
      roomMemberId: payload.roomMemberId,
      text: payload.text,
    },
  });
};

const createMapPayload: WidgetCreateHandler<WidgetType.MAP> = async (
  tx,
  widgetId,
  payload,
) => {
  await tx.mapPoint.create({
    data: {
      widgetId,
      roomMemberId: payload.roomMemberId,
      lat: payload.lat,
      lng: payload.lng,
      title: payload.title,
      description: payload.description,
    },
  });
};

const createExpensePayload: WidgetCreateHandler<WidgetType.EXPENSES> = async (
  tx,
  widgetId,
  payload,
) => {
  await tx.expense.create({
    data: {
      widgetId,
      payerId: payload.payerId,
      amount: payload.amount,
      description: payload.description,
    },
  });
};

export const WIDGET_CREATE_HANDLERS: WidgetCreateHandlersMap = {
  [WidgetType.TASKS]: createTaskPayload,
  [WidgetType.NOTES]: createNotePayload,
  [WidgetType.CHAT]: createChatPayload,
  [WidgetType.MAP]: createMapPayload,
  [WidgetType.EXPENSES]: createExpensePayload,
};

export async function applyWidgetTypePayload<K extends WidgetType>(
  tx: Prisma.TransactionClient,
  type: K,
  widgetId: string,
  payload: WidgetCreatePayloadMap[K],
): Promise<void> {
  const handler = WIDGET_CREATE_HANDLERS[type];
  await handler(tx, widgetId, payload);
}
