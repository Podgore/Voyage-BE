import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasRoomUpdate', async: false })
export class HasRoomUpdateConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const request = args.object as {
      name?: string;
      regenerateInviteCode?: boolean;
    };

    return request.name !== undefined || request.regenerateInviteCode === true;
  }

  defaultMessage(): string {
    return 'Provide a name or set regenerateInviteCode to true';
  }
}
