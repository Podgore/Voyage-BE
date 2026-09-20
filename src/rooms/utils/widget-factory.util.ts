export const WIDGET_TYPES = [
  'chat',
  'notes',
  'tasks',
  'map',
  'expenses',
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

export type WidgetTypeMeta = {
  type: string;
  displayName: string;
};

export const WIDGET_TYPE_META: Record<WidgetType, WidgetTypeMeta> = {
  chat: { type: 'chat', displayName: 'Chat' },
  notes: { type: 'notes', displayName: 'Notes' },
  tasks: { type: 'tasks', displayName: 'Tasks' },
  map: { type: 'map', displayName: 'Map' },
  expenses: { type: 'expenses', displayName: 'Expenses' },
};

export function isSupportedWidgetType(type: string): type is WidgetType {
  return type in WIDGET_TYPE_META;
}

export function getWidgetTypeMeta(type: string): WidgetTypeMeta {
  if (isSupportedWidgetType(type)) {
    return WIDGET_TYPE_META[type];
  }

  return { type, displayName: type };
}

export function createWidgetConnection(roomId: string, type: string) {
  const meta = getWidgetTypeMeta(type);

  return {
    roomId,
    type: meta.type,
    name: meta.displayName,
  };
}

export type WidgetModuleBinding<TPayload extends Record<string, unknown>> = {
  widgetId: string;
  type: string;
  payload: TPayload;
};

export function createWidgetModuleBinding<
  TPayload extends Record<string, unknown>,
>(
  widgetId: string,
  type: string,
  payload: TPayload,
): WidgetModuleBinding<TPayload> {
  const meta = getWidgetTypeMeta(type);

  return {
    widgetId,
    type: meta.type,
    payload,
  };
}
