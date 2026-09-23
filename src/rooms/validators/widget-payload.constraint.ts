import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { WidgetType } from '../enums/widget-type.enum';
import { WidgetPayloadDto } from '../dto/widget-payload.dto';
import { WIDGET_PAYLOAD_VALIDATION_STRATEGIES } from './widget-payload-validation.strategy';

@ValidatorConstraint({ name: 'validWidgetPayload', async: false })
export class WidgetPayloadConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || typeof value !== 'object' || value === null) {
      return false;
    }

    const payload = value as WidgetPayloadDto;
    const type = (args.object as { type?: WidgetType }).type;
    const validatePayload = type
      ? WIDGET_PAYLOAD_VALIDATION_STRATEGIES[type]
      : undefined;

    return validatePayload ? validatePayload(payload) : false;
  }

  defaultMessage(args: ValidationArguments): string {
    return `Payload does not contain the required fields for widget type ${(args.object as { type?: WidgetType }).type ?? 'unknown'}`;
  }
}
