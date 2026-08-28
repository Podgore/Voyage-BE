import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
    },
    roomMember: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const prisma = {
    $transaction: async (
      callback: (client: typeof transaction) => Promise<unknown>,
    ): Promise<unknown> => callback(transaction),
    room: {
      findUnique: jest.fn(),
    },
    roomMember: {
      findFirst: jest.fn(),
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
    const inviteCodeMatcher = expect.stringMatching(
      /^[A-Z0-9]{6}$/,
    ) as unknown as string;
    await expect(
      service.create({ name: 'Summer trip' }, 'user-1'),
    ).resolves.toBe(room);
    expect(transaction.room.create).toHaveBeenCalledWith({
      data: {
        name: 'Summer trip',
        inviteCode: inviteCodeMatcher,
      },
    });
    expect(transaction.roomMember.create).toHaveBeenCalledWith({
      data: {
        roomId: 'room-1',
        userId: 'user-1',
        role: 'owner',
      },
    });
  });

  describe('getRoomHub', () => {
    it('returns room info, current user role, and widgets', async () => {
      const roomWithWidgets = {
        id: 'room-1',
        name: 'Summer trip',
        widgets: [
          { id: 'widget-1', type: 'chat', name: 'Chat', settings: null },
        ],
      };
      prisma.room.findUnique.mockResolvedValue(roomWithWidgets);
      prisma.roomMember.findFirst.mockResolvedValue({ role: 'owner' });

      const result = await service.getRoomHub('room-1', 'user-1');

      expect(result).toEqual({
        id: 'room-1',
        name: 'Summer trip',
        myRole: 'owner',
        widgets: [{ id: 'widget-1', type: 'chat', name: 'Chat' }],
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        include: { widgets: true },
      });
      expect(prisma.roomMember.findFirst).toHaveBeenCalledWith({
        where: { roomId: 'room-1', userId: 'user-1', leftAt: null },
      });
    });

    it('throws NotFoundException when room does not exist', async () => {
      prisma.room.findUnique.mockResolvedValue(null);

      await expect(
        service.getRoomHub('missing-room', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
