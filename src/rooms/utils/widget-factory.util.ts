import { WidgetType } from '../enums/widget-type.enum';
import type { WidgetModuleBinding } from '../types/widget-module-binding.type';
import type { WidgetTypeMeta } from '../types/widget-type-meta.type';

export const WIDGET_TYPE_META: Record<WidgetType, WidgetTypeMeta> = {
  [WidgetType.CHAT]: { type: WidgetType.CHAT, displayName: 'Chat' },
  [WidgetType.NOTES]: { type: WidgetType.NOTES, displayName: 'Notes' },
  [WidgetType.TASKS]: { type: WidgetType.TASKS, displayName: 'Tasks' },
  [WidgetType.MAP]: { type: WidgetType.MAP, displayName: 'Map' },
  [WidgetType.EXPENSES]: {
    type: WidgetType.EXPENSES,
    displayName: 'Expenses',
  },
};

export function getWidgetTypeMeta(type: WidgetType): WidgetTypeMeta {
  return WIDGET_TYPE_META[type];
}

export function createWidgetConnection(roomId: string, type: WidgetType) {
  const meta = getWidgetTypeMeta(type);

  return {
    roomId,
    type: meta.type,
    name: meta.displayName,
  };
}

export function createWidgetModuleBinding<
  TPayload extends Record<string, unknown>,
>(
  widgetId: string,
  type: WidgetType,
  payload: TPayload,
): WidgetModuleBinding<TPayload> {
  const meta = getWidgetTypeMeta(type);

  return {
    widgetId,
    type: meta.type,
    payload,
  };
}
