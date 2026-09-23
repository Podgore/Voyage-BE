import { WidgetType } from '../enums/widget-type.enum';

export type WidgetModuleBinding<TPayload extends Record<string, unknown>> = {
  widgetId: string;
  type: WidgetType;
  payload: TPayload;
};
