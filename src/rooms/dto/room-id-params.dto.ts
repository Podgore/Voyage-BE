import { IsNotEmpty, IsString } from 'class-validator';

export class RoomIdParamsDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}
