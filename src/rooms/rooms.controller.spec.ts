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
    getRoomHub: jest.fn(),
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

  it('returns room hub info for the authenticated user', async () => {
    const roomHub = {
      id: 'room-1',
      name: 'Summer trip',
      myRole: 'owner',
      widgets: [],
    };
    roomsService.getRoomHub.mockResolvedValue(roomHub);

    await expect(
      controller.getRoomHub('room-1', {
        user: { userId: 'user-1', email: 'user1@example.com' },
      } as never),
    ).resolves.toBe(roomHub);
    expect(roomsService.getRoomHub).toHaveBeenCalledWith('room-1', 'user-1');
  });
});
