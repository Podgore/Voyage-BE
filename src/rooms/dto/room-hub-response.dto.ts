import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomWidgetDto } from './room-widget-response.dto';

export class RoomHubDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  myRole?: string;

  @ApiProperty({ type: [RoomWidgetDto] })
  widgets!: RoomWidgetDto[];
}
