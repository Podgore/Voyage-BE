import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WidgetType } from '../../../generated/prisma/enums';

export class ConnectWidgetDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(WidgetType)
  type!: WidgetType;
}
