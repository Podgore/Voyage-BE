import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  regenerateInviteCode?: boolean;
}
