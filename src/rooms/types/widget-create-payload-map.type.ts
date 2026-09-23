import { WidgetType } from '../enums/widget-type.enum';

export type WidgetCreatePayloadMap = {
  [WidgetType.TASKS]: {
    createdById: string;
    assignedToId: string;
    title: string;
    description?: string;
  };
  [WidgetType.NOTES]: {
    roomMemberId: string;
    text: string;
  };
  [WidgetType.CHAT]: {
    roomMemberId: string;
    text: string;
  };
  [WidgetType.MAP]: {
    roomMemberId: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  };
  [WidgetType.EXPENSES]: {
    payerId: string;
    amount: number;
    description?: string;
  };
};
