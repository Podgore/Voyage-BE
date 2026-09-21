import {
  IsBoolean,
  IsString,
  MinLength,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasRoomUpdate', async: false })
class HasRoomUpdateConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const request = args.object as UpdateRoomDto;

    return request.name !== undefined || request.regenerateInviteCode === true;
  }

  defaultMessage(): string {
    return 'Provide a name or set regenerateInviteCode to true';
  }
}

export class UpdateRoomDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  regenerateInviteCode?: boolean;

  @Validate(HasRoomUpdateConstraint)
  private readonly hasUpdate?: unknown;
}
