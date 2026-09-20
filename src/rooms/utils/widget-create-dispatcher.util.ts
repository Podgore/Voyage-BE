import { WidgetType } from './widget-factory.util';

export type WidgetTypePayload = Record<string, unknown>;

export type WidgetCreatePayloadMap = {
  tasks: {
    createdById: string;
    assignedToId: string;
    title: string;
    description?: string;
  };
  notes: {
    roomMemberId: string;
    text: string;
  };
  chat: {
    roomMemberId: string;
    text: string;
  };
  map: {
    roomMemberId: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  };
  expenses: {
    payerId: string;
    amount: number;
    description?: string;
  };
};

type TransactionClient = {
  task?: {
    create: (args: any) => Promise<unknown>;
  };
  note?: {
    create: (args: any) => Promise<unknown>;
  };
  chatMessage?: {
    create: (args: any) => Promise<unknown>;
  };
  mapPoint?: {
    create: (args: any) => Promise<unknown>;
  };
  expense?: {
    create: (args: any) => Promise<unknown>;
  };
};

export type WidgetCreateHandler<TType extends WidgetType = WidgetType> = (
  tx: TransactionClient,
  widgetId: string,
  payload: WidgetCreatePayloadMap[TType],
) => Promise<void>;

type WidgetCreateHandlersMap = {
  [K in WidgetType]: WidgetCreateHandler<K>;
};

const createTaskPayload: WidgetCreateHandler<'tasks'> = async (
  tx,
  widgetId,
  payload,
) => {
  if (!tx.task) {
    return;
  }

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

const createNotePayload: WidgetCreateHandler<'notes'> = async (
  tx,
  widgetId,
  payload,
) => {
  if (!tx.note) {
    return;
  }

  await tx.note.create({
    data: {
      widgetId,
      roomMemberId: payload.roomMemberId,
      text: payload.text,
    },
  });
};

const createChatPayload: WidgetCreateHandler<'chat'> = async (
  tx,
  widgetId,
  payload,
) => {
  if (!tx.chatMessage) {
    return;
  }

  await tx.chatMessage.create({
    data: {
      widgetId,
      roomMemberId: payload.roomMemberId,
      text: payload.text,
    },
  });
};

const createMapPayload: WidgetCreateHandler<'map'> = async (
  tx,
  widgetId,
  payload,
) => {
  if (!tx.mapPoint) {
    return;
  }

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

const createExpensePayload: WidgetCreateHandler<'expenses'> = async (
  tx,
  widgetId,
  payload,
) => {
  if (!tx.expense) {
    return;
  }

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
  tasks: createTaskPayload,
  notes: createNotePayload,
  chat: createChatPayload,
  map: createMapPayload,
  expenses: createExpensePayload,
};

export async function applyWidgetTypePayload<K extends WidgetType>(
  tx: TransactionClient,
  type: K,
  widgetId: string,
  payload: WidgetCreatePayloadMap[K],
) {
  const handler = WIDGET_CREATE_HANDLERS[type];
  await handler(tx, widgetId, payload);
}
