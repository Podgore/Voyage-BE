import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;
}
