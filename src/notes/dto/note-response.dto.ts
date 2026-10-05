import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { NoteAuthorResponseDto } from './note-author-response.dto';

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

  @ApiProperty({ type: NoteAuthorResponseDto })
  @ValidateNested()
  @Type(() => NoteAuthorResponseDto)
  author!: NoteAuthorResponseDto;
}
