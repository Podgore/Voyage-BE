import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { WidgetType } from '../enums/widget-type.enum';
import { WidgetPayloadDto } from '../dto/widget-payload.dto';

@ValidatorConstraint({ name: 'validWidgetPayload', async: false })
export class WidgetPayloadConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || typeof value !== 'object' || value === null) {
      return false;
    }

    const payload = value as WidgetPayloadDto;
    const type = (args.object as { type?: WidgetType }).type;

    switch (type) {
      case WidgetType.TASKS:
        return (
          this.isString(payload.createdById) &&
          this.isString(payload.assignedToId) &&
          this.isString(payload.title)
        );
      case WidgetType.NOTES:
      case WidgetType.CHAT:
        return (
          this.isString(payload.roomMemberId) && this.isString(payload.text)
        );
      case WidgetType.MAP:
        return (
          this.isString(payload.roomMemberId) &&
          this.isNumber(payload.lat) &&
          this.isNumber(payload.lng) &&
          this.isString(payload.title)
        );
      case WidgetType.EXPENSES:
        return this.isString(payload.payerId) && this.isNumber(payload.amount);
      default:
        return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `Payload does not contain the required fields for widget type ${(args.object as { type?: WidgetType }).type ?? 'unknown'}`;
  }

  private isString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  private isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
