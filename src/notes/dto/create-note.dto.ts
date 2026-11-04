import { IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  text?: string;
}
