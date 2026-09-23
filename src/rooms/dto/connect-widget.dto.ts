import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { WidgetType } from '../enums/widget-type.enum';
import type { WidgetCreatePayloadMap } from '../types/widget-create-payload-map.type';

export class ConnectWidgetDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(WidgetType)
  type!: WidgetType;

  @IsOptional()
  @IsObject()
  payload?: WidgetCreatePayloadMap[WidgetType];
}
