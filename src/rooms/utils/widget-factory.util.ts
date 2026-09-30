import { Prisma } from '../../../generated/prisma/client';
import { WidgetType } from '../../../generated/prisma/enums';

export const WIDGET_DISPLAY_NAMES: Record<WidgetType, string> = {
  [WidgetType.CHAT]: 'Chat',
  [WidgetType.NOTES]: 'Notes',
  [WidgetType.TASKS]: 'Tasks',
  [WidgetType.MAP]: 'Map',
  [WidgetType.EXPENSES]: 'Expenses',
};

export function createWidgetConnection(
  roomId: string,
  type: WidgetType,
): Prisma.WidgetUncheckedCreateInput {
  return {
    roomId,
    type,
    name: WIDGET_DISPLAY_NAMES[type],
  };
}
