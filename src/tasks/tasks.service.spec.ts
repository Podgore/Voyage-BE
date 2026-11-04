import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { TaskStatus } from './dto/task-status.enum';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('TasksService', () => {
  let service: TasksService;
  const prisma = {
    roomMember: { findFirst: jest.fn() },
    widget: { findFirst: jest.fn(), create: jest.fn() },
    task: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<TasksService>(TasksService);
  });

  it('creates a todo task without an assignee when none is provided', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.widget.findFirst.mockResolvedValue({ id: 'tasks-widget-1' });
    const task = { id: 'task-1', status: 'todo' };
    prisma.task.create.mockResolvedValue(task);

    await expect(
      service.createTask('room-1', 'user-1', { title: 'Book flights' }),
    ).resolves.toBe(task);

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        widgetId: 'tasks-widget-1',
        createdById: 'member-1',
        assignedToId: null,
        title: 'Book flights',
      },
    });
  });

  it('creates a tasks widget if the room does not have one', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.widget.findFirst.mockResolvedValue(null);
    prisma.widget.create.mockResolvedValue({ id: 'tasks-widget-1' });
    prisma.task.create.mockResolvedValue({ id: 'task-1' });

    await service.createTask('room-1', 'user-1', { title: 'Pack bags' });

    expect(prisma.widget.create).toHaveBeenCalledWith({
      data: { roomId: 'room-1', type: WidgetType.TASKS, name: 'Tasks' },
    });
  });

  it('rejects an assignee who is not an active room member', async () => {
    prisma.roomMember.findFirst
      .mockResolvedValueOnce({ id: 'creator-member-1' })
      .mockResolvedValueOnce(null);

    await expect(
      service.createTask('room-1', 'user-1', {
        title: 'Pack bags',
        assignedToId: 'member-from-another-room',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  describe('updateTaskStatus', () => {
    const dto = { status: TaskStatus.DONE };

    it('lets the task author change the status', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        createdById: 'member-1',
        assignedToId: 'member-2',
      });
      const updated = { id: 'task-1', status: 'done' };
      prisma.task.update.mockResolvedValue(updated);

      await expect(
        service.updateTaskStatus('room-1', 'task-1', 'user-1', dto),
      ).resolves.toBe(updated);

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: 'done' },
      });
    });

    it('lets the assignee change the status', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-2' });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        createdById: 'member-1',
        assignedToId: 'member-2',
      });
      prisma.task.update.mockResolvedValue({ id: 'task-1' });

      await service.updateTaskStatus('room-1', 'task-1', 'user-2', dto);

      expect(prisma.task.update).toHaveBeenCalled();
    });

    it('forbids a member who is neither author nor assignee', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-3' });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        createdById: 'member-1',
        assignedToId: 'member-2',
      });

      await expect(
        service.updateTaskStatus('room-1', 'task-1', 'user-3', dto),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('lets the author change status when the task is unassigned', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        createdById: 'member-1',
        assignedToId: null,
      });
      prisma.task.update.mockResolvedValue({ id: 'task-1' });

      await service.updateTaskStatus('room-1', 'task-1', 'user-1', dto);

      expect(prisma.task.update).toHaveBeenCalled();
    });

    it('forbids a non-author when the task is unassigned', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-3' });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        createdById: 'member-1',
        assignedToId: null,
      });

      await expect(
        service.updateTaskStatus('room-1', 'task-1', 'user-3', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFound if the caller is not an active room member', async () => {
      prisma.roomMember.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTaskStatus('room-1', 'task-1', 'user-1', dto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.task.findFirst).not.toHaveBeenCalled();
    });

    it('throws NotFound if the task is not in this room', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTaskStatus('room-1', 'task-1', 'user-1', dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 'task-1', widget: { roomId: 'room-1' } },
        select: { id: true, createdById: true, assignedToId: true },
      });
    });
  });
});
