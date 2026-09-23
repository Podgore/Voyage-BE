import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetType } from '../enums/widget-type.enum';
import type { WidgetCreatePayloadMap } from '../types/widget-create-payload-map.type';
import { WidgetPayloadDto } from './widget-payload.dto';
import { WidgetPayloadConstraint } from '../validators/widget-payload.constraint';

export class ConnectWidgetDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(WidgetType)
  type!: WidgetType;

  @IsObject()
  @Type(() => WidgetPayloadDto)
  @Validate(WidgetPayloadConstraint)
  payload?: WidgetCreatePayloadMap[WidgetType];
}
