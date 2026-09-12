import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomRole } from '../../generated/prisma/client';
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
    room: {
      create: jest.fn().mockResolvedValue(room),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    roomMember: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const prisma = {
    $transaction: async (
      callback: (client: typeof transaction) => Promise<unknown>,
    ): Promise<unknown> => callback(transaction),
    room: { findUnique: jest.fn() },
    roomMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
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
        role: RoomRole.OWNER,
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

  it('transfers ownership to an active member', async () => {
    transaction.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      role: RoomRole.MEMBER,
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
      role: RoomRole.OWNER,
    });

    await expect(
      service.transferOwnership('room-1', 'owner-1', 'user-2'),
    ).rejects.toThrow(ConflictException);
  });

  describe('leave', () => {
    it('leaves the room as a regular member', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: RoomRole.MEMBER,
      });

      await expect(service.leave('room-1', 'user-1')).resolves.toEqual({
        roomId: 'room-1',
        left: true,
      });
      expect(prisma.roomMember.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { leftAt: expect.any(Date) as Date },
      });
    });

    it('throws when user is not an active member', async () => {
      prisma.roomMember.findFirst.mockResolvedValue(null);

      await expect(service.leave('room-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('blocks the owner from leaving while other members remain', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({
        id: 'owner-membership',
        role: RoomRole.OWNER,
      });
      prisma.roomMember.count.mockResolvedValue(1);

      await expect(service.leave('room-1', 'owner-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('deletes the room when the owner is the last active member', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({
        id: 'owner-membership',
        role: RoomRole.OWNER,
      });
      prisma.roomMember.count.mockResolvedValue(0);

      await expect(service.leave('room-1', 'owner-1')).resolves.toEqual({
        roomId: 'room-1',
        left: true,
        roomDeleted: true,
      });
      expect(transaction.roomMember.deleteMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
      });
      expect(transaction.room.delete).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
    });
  });
});
