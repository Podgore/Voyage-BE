import { IsString } from 'class-validator';

export class WidgetResponseDto {
  @IsString()
  id!: string;

  @IsString()
  type!: string;

  @IsString()
  name!: string;
}
