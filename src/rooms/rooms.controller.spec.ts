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
    transferOwnership: jest.fn(),
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

  it('transfers ownership for the authenticated owner', async () => {
    const result = { roomId: 'room-1', newOwnerId: 'user-2' };
    roomsService.transferOwnership.mockResolvedValue(result);

    await expect(
      controller.transferOwnership('room-1', { targetUserId: 'user-2' }, {
        user: { userId: 'user-1', email: 'user1@example.com' },
      } as never),
    ).resolves.toBe(result);
    expect(roomsService.transferOwnership).toHaveBeenCalledWith(
      'room-1',
      'user-1',
      'user-2',
    );
  });
});
