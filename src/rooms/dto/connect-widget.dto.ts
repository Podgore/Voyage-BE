import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ConnectWidgetDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['chat', 'tasks', 'notes', 'map', 'expenses'])
  type!: string;
}
