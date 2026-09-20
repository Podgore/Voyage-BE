import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { WidgetType } from '../utils/widget-factory.util';

export class ConnectWidgetDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['chat', 'tasks', 'notes', 'map', 'expenses'])
  type!: WidgetType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
