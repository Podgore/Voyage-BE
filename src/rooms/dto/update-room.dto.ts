import {
  IsBoolean,
  IsString,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';

import { HasRoomUpdateConstraint } from './has-room-update.constraint';

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
