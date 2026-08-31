import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('RoomsController', () => {
  let controller: RoomsController;
  const roomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: roomsService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('creates a room for the authenticated user', async () => {
    const createdRoom = { id: 'room-1' };
    roomsService.create.mockResolvedValue(createdRoom);

    await expect(
      controller.create(
        { name: 'Summer trip' },
        {
          user: { userId: 'user-1' },
        },
      ),
    ).resolves.toBe(createdRoom);

    expect(roomsService.create).toHaveBeenCalledWith(
      { name: 'Summer trip' },
      'user-1',
    );
  });

  it('lists active rooms for the authenticated user', async () => {
    const rooms = [{ id: 'room-1' }, { id: 'room-2' }];
    roomsService.findAll.mockResolvedValue(rooms);

    await expect(
      controller.findAll({
        user: { userId: 'user-1' },
      }),
    ).resolves.toEqual(rooms);

    expect(roomsService.findAll).toHaveBeenCalledWith('user-1');
  });
});
