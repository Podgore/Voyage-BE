import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  inviteCode!: string;

  @ApiProperty()
  createdAt!: Date;
}
