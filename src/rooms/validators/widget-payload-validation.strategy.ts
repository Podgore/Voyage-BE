import { WidgetType } from '../enums/widget-type.enum';
import { WidgetPayloadDto } from '../dto/widget-payload.dto';

const isNonEmptyString = (value: unknown): boolean =>
  typeof value === 'string' && value.length > 0;

const isFiniteNumber = (value: unknown): boolean =>
  typeof value === 'number' && Number.isFinite(value);

const hasRequiredFields = (
  payload: WidgetPayloadDto,
  requirements: readonly {
    field: keyof WidgetPayloadDto;
    validate: (value: unknown) => boolean;
  }[],
): boolean =>
  requirements.every(({ field, validate }) => validate(payload[field]));

const textWidgetRequirements = [
  { field: 'roomMemberId', validate: isNonEmptyString },
  { field: 'text', validate: isNonEmptyString },
] as const;

export const WIDGET_PAYLOAD_VALIDATION_STRATEGIES: Record<
  WidgetType,
  (payload: WidgetPayloadDto) => boolean
> = {
  [WidgetType.TASKS]: (payload) =>
    hasRequiredFields(payload, [
      { field: 'createdById', validate: isNonEmptyString },
      { field: 'assignedToId', validate: isNonEmptyString },
      { field: 'title', validate: isNonEmptyString },
    ]),
  [WidgetType.NOTES]: (payload) =>
    hasRequiredFields(payload, textWidgetRequirements),
  [WidgetType.CHAT]: (payload) =>
    hasRequiredFields(payload, textWidgetRequirements),
  [WidgetType.MAP]: (payload) =>
    hasRequiredFields(payload, [
      { field: 'roomMemberId', validate: isNonEmptyString },
      { field: 'lat', validate: isFiniteNumber },
      { field: 'lng', validate: isFiniteNumber },
      { field: 'title', validate: isNonEmptyString },
    ]),
  [WidgetType.EXPENSES]: (payload) =>
    hasRequiredFields(payload, [
      { field: 'payerId', validate: isNonEmptyString },
      { field: 'amount', validate: isFiniteNumber },
    ]),
};
