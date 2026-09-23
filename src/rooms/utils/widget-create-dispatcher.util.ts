import { Prisma } from '../../../generated/prisma/client';
import { WidgetType } from '../enums/widget-type.enum';
import type { WidgetCreateHandler } from '../types/widget-create-handler.type';
import type { WidgetCreatePayloadMap } from '../types/widget-create-payload-map.type';

type WidgetCreateHandlersMap = {
  [K in WidgetType]: WidgetCreateHandler<K>;
};

type WidgetPayloadWithId<TType extends WidgetType> =
  WidgetCreatePayloadMap[TType] & { widgetId: string };

type WidgetRecordCreator<TType extends WidgetType, TResult> = (
  transaction: Prisma.TransactionClient,
  data: WidgetPayloadWithId<TType>,
) => Promise<TResult>;

function createWidgetHandler<TType extends WidgetType>() {
  return <TResult>(
    createRecord: WidgetRecordCreator<TType, TResult>,
  ): WidgetCreateHandler<TType> => {
    return async (transaction, widgetId, payload) => {
      await createRecord(transaction, { widgetId, ...payload });
    };
  };
}

const createTaskPayload = createWidgetHandler<WidgetType.TASKS>()(
  (transaction, data) => transaction.task.create({ data }),
);

const createNotePayload = createWidgetHandler<WidgetType.NOTES>()(
  (transaction, data) => transaction.note.create({ data }),
);

const createChatPayload = createWidgetHandler<WidgetType.CHAT>()(
  (transaction, data) => transaction.chatMessage.create({ data }),
);

const createMapPayload = createWidgetHandler<WidgetType.MAP>()(
  (transaction, data) => transaction.mapPoint.create({ data }),
);

const createExpensePayload = createWidgetHandler<WidgetType.EXPENSES>()(
  (transaction, data) => transaction.expense.create({ data }),
);

export const WIDGET_CREATE_HANDLERS: WidgetCreateHandlersMap = {
  [WidgetType.TASKS]: createTaskPayload,
  [WidgetType.NOTES]: createNotePayload,
  [WidgetType.CHAT]: createChatPayload,
  [WidgetType.MAP]: createMapPayload,
  [WidgetType.EXPENSES]: createExpensePayload,
};

export async function applyWidgetTypePayload<K extends WidgetType>(
  transaction: Prisma.TransactionClient,
  type: K,
  widgetId: string,
  payload: WidgetCreatePayloadMap[K],
): Promise<void> {
  const handler = WIDGET_CREATE_HANDLERS[type];
  await handler(transaction, widgetId, payload);
}
