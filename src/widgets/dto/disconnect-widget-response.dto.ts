import { IsBoolean, IsString } from 'class-validator';

export class DisconnectWidgetResponseDto {
  @IsString()
  widgetId!: string;

  @IsBoolean()
  isDeleted!: boolean;
}
