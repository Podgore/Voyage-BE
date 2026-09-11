import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
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
    findMembers: jest.fn(),
    findWidgets: jest.fn(),
    getRoomHub: jest.fn(),
    updateRoom: jest.fn(),
    connectWidget: jest.fn(),
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

  it('lists active rooms for the authenticated user', async () => {
    const rooms = [{ id: 'room-1' }, { id: 'room-2' }];
    roomsService.findAll.mockResolvedValue(rooms);

    await expect(
      controller.findAll(
        {
          user: { userId: 'user-1' },
        },
        1,
        10,
      ),
    ).resolves.toEqual(rooms);

    expect(roomsService.findAll).toHaveBeenCalledWith('user-1', 1, 10);
  });

  it('lists active room members by default', async () => {
    const members = [{ id: 'membership-1', role: 'owner' }];
    roomsService.findMembers.mockResolvedValue(members);

    await expect(controller.findMembers('room-1', false)).resolves.toEqual(
      members,
    );

    expect(roomsService.findMembers).toHaveBeenCalledWith('room-1', false);
  });

  it('can include departed room members when requested', async () => {
    const members = [
      { id: 'membership-1', role: 'owner' },
      { id: 'membership-2', role: 'member' },
    ];
    roomsService.findMembers.mockResolvedValue(members);

    await expect(controller.findMembers('room-1', true)).resolves.toEqual(
      members,
    );

    expect(roomsService.findMembers).toHaveBeenCalledWith('room-1', true);
  });

  it('lists connected widgets for a room member', async () => {
    const widgets = [{ id: 'widget-1', type: 'chat', name: 'Chat' }];
    roomsService.findWidgets.mockResolvedValue(widgets);

    await expect(controller.findWidgets('room-1')).resolves.toEqual(widgets);

    expect(roomsService.findWidgets).toHaveBeenCalledWith('room-1');
  });

  it('returns room hub info for the authenticated user', async () => {
    const roomHub = { id: 'room-1', name: 'Summer trip', widgets: [] };
    roomsService.getRoomHub.mockResolvedValue(roomHub);

    await expect(
      controller.getRoomHub('room-1', { user: { userId: 'user-1' } } as never),
    ).resolves.toBe(roomHub);
    expect(roomsService.getRoomHub).toHaveBeenCalledWith('room-1', 'user-1');
  });

  it('updates room data for the authenticated owner', async () => {
    const result = { id: 'room-1', name: 'Updated trip', inviteCode: 'XYZ789' };
    roomsService.updateRoom.mockResolvedValue(result);

    await expect(
      controller.updateRoom('room-1', { name: 'Updated trip' }),
    ).resolves.toBe(result);

    expect(roomsService.updateRoom).toHaveBeenCalledWith('room-1', {
      name: 'Updated trip',
    });
  });

  it('connects a widget for the authenticated owner', async () => {
    const result = {
      id: 'widget-1',
      roomId: 'room-1',
      type: 'chat',
      name: 'Chat',
    };
    roomsService.connectWidget.mockResolvedValue(result);

    await expect(
      controller.connectWidget(
        'room-1',
        { type: 'chat' },
        {
          user: { userId: 'user-1' },
        },
      ),
    ).resolves.toBe(result);

    expect(roomsService.connectWidget).toHaveBeenCalledWith('room-1', {
      type: 'chat',
    });
  });

  it('transfers ownership for the authenticated owner', async () => {
    const result = { roomId: 'room-1', newOwnerId: 'user-2' };
    roomsService.transferOwnership.mockResolvedValue(result);

    await expect(
      controller.transferOwnership('room-1', { targetUserId: 'user-2' }, {
        user: { userId: 'user-1' },
      } as never),
    ).resolves.toBe(result);
  });
});
