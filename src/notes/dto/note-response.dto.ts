import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NoteResponseDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  roomMemberId!: string;

  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsString()
  createdAt!: string;
}
