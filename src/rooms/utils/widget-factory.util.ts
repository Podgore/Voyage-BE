import { WidgetType } from '../enums/widget-type.enum';

export const WIDGET_DISPLAY_NAMES: Record<WidgetType, string> = {
  [WidgetType.CHAT]: 'Chat',
  [WidgetType.NOTES]: 'Notes',
  [WidgetType.TASKS]: 'Tasks',
  [WidgetType.MAP]: 'Map',
  [WidgetType.EXPENSES]: 'Expenses',
};

export function createWidgetConnection(roomId: string, type: WidgetType) {
  return {
    roomId,
    type,
    name: WIDGET_DISPLAY_NAMES[type],
  };
}
