import { IsOptional, IsUUID } from 'class-validator';

export class UpdateTaskDto {
  @IsUUID()
  @IsOptional()
  assignedToId?: string | null;
}
