import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('TasksService', () => {
  let service: TasksService;
  const prisma = {
    roomMember: { findFirst: jest.fn() },
    widget: { findFirst: jest.fn(), create: jest.fn() },
    task: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<TasksService>(TasksService);
  });

  it('creates a todo task and assigns it to its creator', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.widget.findFirst.mockResolvedValue({ id: 'tasks-widget-1' });
    const task = { id: 'task-1', status: 'todo' };
    prisma.task.create.mockResolvedValue(task);

    await expect(
      service.create('room-1', 'user-1', { title: 'Book flights' }),
    ).resolves.toBe(task);

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        widgetId: 'tasks-widget-1',
        createdById: 'member-1',
        assignedToId: 'member-1',
        title: 'Book flights',
      },
    });
  });

  it('creates a tasks widget if the room does not have one', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.widget.findFirst.mockResolvedValue(null);
    prisma.widget.create.mockResolvedValue({ id: 'tasks-widget-1' });
    prisma.task.create.mockResolvedValue({ id: 'task-1' });

    await service.create('room-1', 'user-1', { title: 'Pack bags' });

    expect(prisma.widget.create).toHaveBeenCalledWith({
      data: { roomId: 'room-1', type: 'tasks', name: 'Tasks' },
    });
  });

  it('rejects an assignee who is not an active room member', async () => {
    prisma.roomMember.findFirst
      .mockResolvedValueOnce({ id: 'creator-member-1' })
      .mockResolvedValueOnce(null);

    await expect(
      service.create('room-1', 'user-1', {
        title: 'Pack bags',
        assignedToId: 'member-from-another-room',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
