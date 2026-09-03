import { ApiProperty } from '@nestjs/swagger';

export class RoomListResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  inviteCode!: string;

  @ApiProperty()
  createdAt!: Date;
}
