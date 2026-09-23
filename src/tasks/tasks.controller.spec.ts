import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: tasksService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('creates a task for the authenticated room member', async () => {
    const task = { id: 'task-1', status: 'todo' };
    tasksService.create.mockResolvedValue(task);

    await expect(
      controller.create('room-1', { title: 'Book flights' }, {
        user: { userId: 'user-1', email: 'user1@example.com' },
      } as never),
    ).resolves.toBe(task);

    expect(tasksService.create).toHaveBeenCalledWith('room-1', 'user-1', {
      title: 'Book flights',
    });
  });
});
