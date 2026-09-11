import { IsBoolean, IsNotEmpty } from 'class-validator';

export class DisconnectWidgetDto {
  @IsBoolean()
  @IsNotEmpty()
  confirm!: boolean;
}
