import { Prisma } from '../../../generated/prisma/client';
import { WidgetType } from '../enums/widget-type.enum';
import { WidgetCreatePayloadMap } from './widget-create-payload-map.type';

export type WidgetCreateHandler<TType extends WidgetType> = (
  tx: Prisma.TransactionClient,
  widgetId: string,
  payload: WidgetCreatePayloadMap[TType],
) => Promise<void>;
