import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class NoteAttachmentResponseDto {
  static fromEntity(attachment: {
    id: string;
    noteId: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }): NoteAttachmentResponseDto {
    return {
      id: attachment.id,
      noteId: attachment.noteId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt.toISOString(),
    };
  }

  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  noteId!: string;

  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  mimeType!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  size!: number;

  @ApiProperty()
  @IsString()
  createdAt!: string;
}
