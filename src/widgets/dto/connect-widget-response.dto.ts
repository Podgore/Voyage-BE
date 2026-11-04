import { IsString } from 'class-validator';

export class ConnectWidgetResponseDto {
  @IsString()
  id!: string;

  @IsString()
  roomId!: string;

  @IsString()
  type!: string;

  @IsString()
  name!: string;
}
