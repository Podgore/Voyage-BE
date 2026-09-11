import { ApiProperty } from '@nestjs/swagger';

export class RoomWidgetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  name!: string;
}
