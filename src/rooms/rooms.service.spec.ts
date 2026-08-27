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
    room: {
      create: jest.fn().mockResolvedValue(room),
      findUnique: jest.fn(),
    },
    roomMember: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
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

  it('joins a room as a member', async () => {
    transaction.room.findUnique.mockResolvedValue(room);
    transaction.roomMember.findUnique.mockResolvedValue(null);
    const membership = { id: 'member-1', roomId: room.id, userId: 'user-2' };
    transaction.roomMember.create.mockResolvedValue(membership);

    await expect(
      service.join({ inviteCode: room.inviteCode }, 'user-2'),
    ).resolves.toBe(membership);

    expect(transaction.roomMember.create).toHaveBeenCalledWith({
      data: { roomId: room.id, userId: 'user-2', role: 'member' },
    });
  });

  it('reuses a left membership when joining again', async () => {
    transaction.room.findUnique.mockResolvedValue(room);
    const membership = {
      id: 'member-1',
      roomId: room.id,
      userId: 'user-2',
      leftAt: new Date(),
    };
    transaction.roomMember.findUnique.mockResolvedValue(membership);
    transaction.roomMember.update.mockResolvedValue({
      ...membership,
      leftAt: null,
      role: 'member',
    });

    await service.join({ inviteCode: room.inviteCode }, 'user-2');

    expect(transaction.roomMember.update).toHaveBeenCalledWith({
      where: { id: membership.id },
      data: { leftAt: null, role: 'member' },
    });
  });
});
