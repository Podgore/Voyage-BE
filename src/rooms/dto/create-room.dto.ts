import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string;
}
