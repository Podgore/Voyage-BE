import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { NoteAttachmentResponseDto } from './note-attachment-response.dto';

export class NoteResponseDto {
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

  @ApiProperty({ type: [NoteAttachmentResponseDto], default: [] })
  @IsArray()
  attachments!: NoteAttachmentResponseDto[];
}
