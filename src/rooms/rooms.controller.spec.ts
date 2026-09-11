import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('RoomsController', () => {
  let controller: RoomsController;

  const roomsService = {
    create: jest.fn(),
    removeMember: jest.fn(),
    leaveRoom: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        { provide: RoomsService, useValue: roomsService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    controller = module.get<RoomsController>(RoomsController);
  });

  it('creates a room for the authenticated user', async () => {
    const createdRoom = { id: 'room-1' };
    roomsService.create.mockResolvedValue(createdRoom);
    await expect(
      controller.create({ name: 'Summer trip' }, {
        user: { userId: 'user-1', email: 'user1@example.com' },
      } as never),
    ).resolves.toBe(createdRoom);
    expect(roomsService.create).toHaveBeenCalledWith(
      { name: 'Summer trip' },
      'user-1',
    );
  });

  it('removes a member for the authenticated owner', async () => {
    const result = { roomId: 'room-1', removedUserId: 'user-2' };
    roomsService.removeMember.mockResolvedValue(result);

    await expect(
      controller.removeMember('room-1', { targetUserId: 'user-2' }, {
        user: { userId: 'user-1', email: 'user1@example.com' },
      } as never),
    ).resolves.toBe(result);
    expect(roomsService.removeMember).toHaveBeenCalledWith(
      'room-1',
      'user-1',
      'user-2',
    );
  });

  it('lets the authenticated member leave a room', async () => {
    const result = { roomId: 'room-1', leftUserId: 'user-1' };
    roomsService.leaveRoom.mockResolvedValue(result);

    await expect(
      controller.leaveRoom('room-1', {
        user: { userId: 'user-1', email: 'user1@example.com' },
      } as never),
    ).resolves.toBe(result);
    expect(roomsService.leaveRoom).toHaveBeenCalledWith('room-1', 'user-1');
  });
});
