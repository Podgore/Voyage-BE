import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUrl } from 'class-validator';

export class NoteAttachmentDownloadUrlResponseDto {
  @ApiProperty()
  @IsUrl()
  url!: string;

  @ApiProperty({ description: 'Expiration time of the signed URL' })
  @IsDateString()
  expiresAt!: string;
}
