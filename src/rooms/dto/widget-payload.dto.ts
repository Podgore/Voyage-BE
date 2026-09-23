import { IsNumber, IsOptional, IsString } from 'class-validator';

export class WidgetPayloadDto {
  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  roomMemberId?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  payerId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
