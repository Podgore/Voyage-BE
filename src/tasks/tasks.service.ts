import { Injectable, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

const TASK_WIDGET_TYPE = 'tasks';
const TASK_WIDGET_NAME = 'Tasks';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(roomId: string, userId: string, dto: CreateTaskDto) {
    const creator = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
    });

    if (!creator) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    let assignedToId = creator.id;

    if (dto.assignedToId) {
      const assignee = await this.prisma.roomMember.findFirst({
        where: { id: dto.assignedToId, roomId, leftAt: null },
      });

      if (!assignee) {
        throw new NotFoundException(ERROR_MESSAGES.TARGET_NOT_ACTIVE_MEMBER);
      }

      assignedToId = assignee.id;
    }

    let widget = await this.prisma.widget.findFirst({
      where: { roomId, type: TASK_WIDGET_TYPE },
    });

    if (!widget) {
      widget = await this.prisma.widget.create({
        data: { roomId, type: TASK_WIDGET_TYPE, name: TASK_WIDGET_NAME },
      });
    }

    return this.prisma.task.create({
      data: {
        widgetId: widget.id,
        createdById: creator.id,
        assignedToId,
        title: dto.title,
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }
}
