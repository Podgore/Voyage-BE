import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WidgetType } from '../enums/widget-type.enum';

export class ConnectWidgetDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(WidgetType)
  type!: WidgetType;
}
