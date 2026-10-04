import { IsOptional, IsUUID } from 'class-validator';

export class UpdateTaskAssigneeDto {
  @IsUUID()
  @IsOptional()
  assignedToId!: string | null;
}
