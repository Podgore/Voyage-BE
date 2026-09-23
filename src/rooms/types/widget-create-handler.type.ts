import { Prisma } from '../../../generated/prisma/client';
import { WidgetType } from '../enums/widget-type.enum';
import { WidgetCreatePayloadMap } from './widget-create-payload-map.type';

export type WidgetCreateHandler<TType extends WidgetType> = (
  transaction: Prisma.TransactionClient,
  widgetId: string,
  payload: WidgetCreatePayloadMap[TType],
) => Promise<void>;
