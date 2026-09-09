import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomMemberUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

export class RoomMemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  joinedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  leftAt!: Date | null;

  @ApiProperty({ type: RoomMemberUserDto })
  user!: RoomMemberUserDto;
}
