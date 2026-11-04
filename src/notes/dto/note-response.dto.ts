import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { NoteAttachmentResponseDto } from './note-attachment-response.dto';
import { NoteAuthorResponseDto } from './note-author-response.dto';

export class NoteResponseDto {
  static fromValues(
    note: {
      id: string;
      roomMemberId: string;
      text: string | null;
      createdAt: Date;
    },
    author: NoteAuthorResponseDto,
    attachments: NoteAttachmentResponseDto[] = [],
  ): NoteResponseDto {
    return {
      id: note.id,
      roomMemberId: note.roomMemberId,
      text: note.text,
      createdAt: note.createdAt.toISOString(),
      author,
      attachments,
    };
  }

  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  roomMemberId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string | null;

  @ApiProperty()
  @IsString()
  createdAt!: string;

  @ApiProperty({ type: NoteAuthorResponseDto })
  @ValidateNested()
  @Type(() => NoteAuthorResponseDto)
  author!: NoteAuthorResponseDto;

  @ApiProperty({ type: [NoteAttachmentResponseDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteAttachmentResponseDto)
  attachments!: NoteAttachmentResponseDto[];
}
