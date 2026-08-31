import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
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
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const prisma = {
    $transaction: async (
      callback: (client: typeof transaction) => Promise<unknown>,
    ): Promise<unknown> => callback(transaction),
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

  describe('transferOwnership', () => {
    it('transfers ownership to an active member', async () => {
      transaction.roomMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: 'member',
      });

      const result = await service.transferOwnership(
        'room-1',
        'owner-1',
        'user-2',
      );

      expect(result).toEqual({ roomId: 'room-1', newOwnerId: 'user-2' });
      expect(transaction.roomMember.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', userId: 'owner-1', role: 'owner' },
        data: { role: 'member' },
      });
      expect(transaction.roomMember.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { role: 'owner' },
      });
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
        role: 'owner',
      });

      await expect(
        service.transferOwnership('room-1', 'owner-1', 'user-2'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
