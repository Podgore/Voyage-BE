import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class NoteAttachmentResponseDto {
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
  url!: string;

  @ApiProperty()
  @IsString()
  createdAt!: string;
}
