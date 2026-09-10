import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from './rooms.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('RoomsService', () => {
  let service: RoomsService;
  const room = {
    id: 'room-1',
    name: 'Summer trip',
    inviteCode: 'ABC123',
    createdAt: new Date(),
  };
  const transaction = {
    room: { create: jest.fn().mockResolvedValue(room), findUnique: jest.fn() },
    roomMember: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma: {
    $transaction: (
      callback: (client: typeof transaction) => Promise<unknown>,
    ) => Promise<unknown>;
    room: { findUnique: jest.Mock; update: jest.Mock };
    roomMember: { findMany: jest.Mock; findFirst: jest.Mock };
  } = {
    $transaction: async (
      callback: (client: typeof transaction) => Promise<unknown>,
    ): Promise<unknown> => callback(transaction),
    room: { findUnique: jest.fn(), update: jest.fn() },
    roomMember: { findMany: jest.fn(), findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<RoomsService>(RoomsService);
  });

  it('creates a room and makes its creator the owner', async () => {
    await expect(
      service.create({ name: 'Summer trip' }, 'user-1'),
    ).resolves.toBe(room);
    expect(transaction.roomMember.create).toHaveBeenCalledWith({
      data: {
        roomId: 'room-1',
        userId: 'user-1',
        role: 'OWNER',
      },
    });
  });

  it('joins a room as a member', async () => {
    transaction.room.findUnique.mockResolvedValue(room);
    transaction.roomMember.findUnique.mockResolvedValue(null);
    transaction.roomMember.create.mockResolvedValue({
      id: 'member-1',
      roomId: room.id,
      userId: 'user-2',
      role: 'member',
    });

    await expect(
      service.joinRoom({ inviteCode: room.inviteCode }, 'user-2'),
    ).resolves.toEqual({
      id: 'member-1',
      roomId: room.id,
      userId: 'user-2',
      role: 'member',
    });
  });

  it('returns only active rooms for the authenticated user', async () => {
    prisma.roomMember.findMany.mockResolvedValue([{ room }]);

    await expect(service.findAll('user-1')).resolves.toEqual([room]);
    expect(prisma.roomMember.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', leftAt: null },
      select: {
        room: {
          select: { id: true, name: true, inviteCode: true, createdAt: true },
        },
      },
      skip: 0,
      take: 10,
    });
  });

  it('returns active room members by default', async () => {
    const member = {
      id: 'membership-1',
      role: 'owner',
      joinedAt: new Date(),
      leftAt: null,
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    };
    prisma.roomMember.findMany.mockResolvedValue([member]);

    await expect(service.findMembers('room-1')).resolves.toEqual([member]);
    expect(prisma.roomMember.findMany).toHaveBeenCalledWith({
      where: { roomId: 'room-1', leftAt: null },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        leftAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  });

  it('can include departed room members', async () => {
    prisma.roomMember.findMany.mockResolvedValue([]);

    await expect(service.findMembers('room-1', true)).resolves.toEqual([]);
    expect(prisma.roomMember.findMany).toHaveBeenCalledWith({
      where: { roomId: 'room-1' },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        leftAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  });

  it('returns room hub information for the authenticated user', async () => {
    prisma.room.findUnique.mockResolvedValue({
      id: 'room-1',
      name: 'Summer trip',
      widgets: [{ id: 'widget-1', type: 'chat', name: 'Chat' }],
    });
    prisma.roomMember.findFirst.mockResolvedValue({ role: 'owner' });

    await expect(service.getRoomHub('room-1', 'user-1')).resolves.toEqual({
      id: 'room-1',
      name: 'Summer trip',
      myRole: 'owner',
      widgets: [{ id: 'widget-1', type: 'chat', name: 'Chat' }],
    });
  });

  it('updates the room name for the owner', async () => {
    prisma.room.findUnique.mockResolvedValue(room);
    prisma.room.update.mockResolvedValue({
      ...room,
      name: 'Updated summer trip',
    });

    await expect(
      service.updateRoom('room-1', { name: 'Updated summer trip' }),
    ).resolves.toEqual({
      ...room,
      name: 'Updated summer trip',
    });

    expect(prisma.room.update).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      data: { name: 'Updated summer trip' },
    });
  });

  it('regenerates the invite code for the owner', async () => {
    prisma.room.findUnique.mockResolvedValue(room);
    prisma.room.update.mockResolvedValue({
      ...room,
      inviteCode: 'XYZ789',
    });

    await expect(
      service.updateRoom('room-1', { regenerateInviteCode: true }),
    ).resolves.toEqual({
      ...room,
      inviteCode: 'XYZ789',
    });

    const roomUpdateMock = prisma.room.update as jest.MockedFunction<
      typeof prisma.room.update
    >;
    const firstCall = roomUpdateMock.mock.calls[0] as
      | [
          {
            where: { id: string };
            data: { inviteCode: string };
          },
        ]
      | undefined;

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0].where).toEqual({ id: 'room-1' });
    expect(firstCall?.[0].data.inviteCode).toBeTruthy();
    expect(firstCall?.[0].data.inviteCode).not.toBe(room.inviteCode);
  });

  it('transfers ownership to an active member', async () => {
    transaction.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      role: 'member',
    });

    await expect(
      service.transferOwnership('room-1', 'owner-1', 'user-2'),
    ).resolves.toEqual({ roomId: 'room-1', newOwnerId: 'user-2' });
  });

  it('throws when target is not an active member', async () => {
    transaction.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.transferOwnership('room-1', 'owner-1', 'user-2'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when target is already the owner', async () => {
    transaction.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      role: 'OWNER',
    });

    await expect(
      service.transferOwnership('room-1', 'owner-1', 'user-2'),
    ).rejects.toThrow(ConflictException);
  });
});
