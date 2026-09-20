import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  createWidgetConnection,
  createWidgetModuleBinding,
  getWidgetTypeMeta,
} from './utils/widget-factory.util';
import { RoomsService } from './rooms.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

type TransactionResult = {
  id?: string;
  roomId?: string;
  userId?: string;
  role?: string;
  name?: string;
  inviteCode?: string;
  createdAt?: Date;
  joinedAt?: Date | null;
  leftAt?: Date | null;
};

type TransactionClient = {
  room: {
    create: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  roomMember: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  widget: {
    create: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  task: {
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  note: {
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  chatMessage: {
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  mapPoint: {
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  expense: {
    create: jest.Mock;
    findMany: jest.Mock;
    deleteMany: jest.Mock;
  };
  expenseShare: {
    findFirst: jest.Mock;
    deleteMany: jest.Mock;
  };
};

describe('widget factory', () => {
  it('creates a widget connection payload from a room and type', () => {
    expect(createWidgetConnection('room-1', 'tasks')).toEqual({
      roomId: 'room-1',
      type: 'tasks',
      name: 'Tasks',
    });
  });

  it('returns metadata for supported widget types', () => {
    expect(getWidgetTypeMeta('expenses')).toEqual({
      type: 'expenses',
      displayName: 'Expenses',
    });
  });

  it('creates a module binding payload for a widget type', () => {
    expect(
      createWidgetModuleBinding('widget-1', 'tasks', {
        title: 'Buy tickets',
        createdById: 'member-1',
      }),
    ).toEqual({
      widgetId: 'widget-1',
      type: 'tasks',
      payload: {
        title: 'Buy tickets',
        createdById: 'member-1',
      },
    });
  });
});

describe('RoomsService', () => {
  let service: RoomsService;
  const room = {
    id: 'room-1',
    name: 'Summer trip',
    inviteCode: 'ABC123',
    createdAt: new Date(),
  };
  const transaction: TransactionClient = {
    room: {
      create: jest.fn().mockResolvedValue(room),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    roomMember: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    widget: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    note: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    mapPoint: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    expense: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    expenseShare: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const mockedTransaction = transaction as jest.Mocked<TransactionClient>;
  const prisma: {
    $transaction: (
      callback: (client: TransactionClient) => Promise<TransactionResult>,
    ) => Promise<TransactionResult>;
    room: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    roomMember: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    widget: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  } = {
    $transaction: async (
      callback: (client: TransactionClient) => Promise<TransactionResult>,
    ): Promise<TransactionResult> => callback(transaction),
    room: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    roomMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    widget: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
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

  it('lists connected widgets for a room', async () => {
    prisma.room.findUnique.mockResolvedValue({
      widgets: [{ id: 'widget-1', type: 'chat', name: 'Chat' }],
    });

    await expect(service.findWidgets('room-1')).resolves.toEqual([
      { id: 'widget-1', type: 'chat', name: 'Chat' },
    ]);

    expect(prisma.room.findUnique).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      select: {
        widgets: {
          select: {
            id: true,
            type: true,
            name: true,
          },
        },
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

  it('returns the current room when there is nothing to update', async () => {
    prisma.room.findUnique.mockResolvedValue(room);

    await expect(
      service.updateRoom('room-1', {
        name: undefined,
        regenerateInviteCode: false,
      }),
    ).resolves.toEqual(room);
    expect(prisma.room.update).not.toHaveBeenCalled();
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

  it('connects a widget to the room', async () => {
    prisma.room.findUnique.mockResolvedValue(room);
    transaction.widget.create.mockResolvedValue({
      id: 'widget-1',
      roomId: 'room-1',
      type: 'chat',
      name: 'Chat',
    });

    await expect(
      service.connectWidget('room-1', { type: 'chat' }),
    ).resolves.toEqual({
      id: 'widget-1',
      roomId: 'room-1',
      type: 'chat',
      name: 'Chat',
    });

    expect(transaction.widget.create).toHaveBeenCalledWith({
      data: {
        roomId: 'room-1',
        type: 'chat',
        name: 'Chat',
      },
    });
  });

  it('creates a widget and typed module payload in one call when payload is provided', async () => {
    prisma.room.findUnique.mockResolvedValue(room);
    transaction.widget.create.mockResolvedValue({
      id: 'widget-1',
      roomId: 'room-1',
      type: 'tasks',
      name: 'Tasks',
    });
    transaction.task.create.mockResolvedValue({
      id: 'task-1',
      widgetId: 'widget-1',
      title: 'Prepare itinerary',
    });

    await expect(
      service.connectWidget('room-1', {
        type: 'tasks',
        payload: {
          createdById: 'member-1',
          assignedToId: 'member-2',
          title: 'Prepare itinerary',
          description: 'Draft the trip plan',
        },
      }),
    ).resolves.toEqual({
      id: 'widget-1',
      roomId: 'room-1',
      type: 'tasks',
      name: 'Tasks',
    });

    expect(transaction.task.create).toHaveBeenCalledWith({
      data: {
        widgetId: 'widget-1',
        createdById: 'member-1',
        assignedToId: 'member-2',
        title: 'Prepare itinerary',
        description: 'Draft the trip plan',
      },
    });
  });

  it('throws a conflict when a widget type is already connected to the room', async () => {
    prisma.room.findUnique.mockResolvedValue(room);
    transaction.widget.create.mockRejectedValue({
      code: 'P2002',
      message: 'Unique constraint failed',
    });

    await expect(
      service.connectWidget('room-1', { type: 'chat' }),
    ).rejects.toThrow(ConflictException);
  });

  it('disconnects a widget and removes its related records', async () => {
    const widget = {
      id: 'widget-1',
      roomId: 'room-1',
      type: 'chat',
      name: 'Chat',
    };

    mockedTransaction.widget.findUnique.mockResolvedValue(widget);
    mockedTransaction.expense.findMany.mockResolvedValue([]);
    mockedTransaction.task.deleteMany.mockResolvedValue({ count: 0 });
    mockedTransaction.note.deleteMany.mockResolvedValue({ count: 0 });
    mockedTransaction.mapPoint.deleteMany.mockResolvedValue({ count: 0 });
    mockedTransaction.chatMessage.deleteMany.mockResolvedValue({ count: 0 });
    mockedTransaction.expenseShare.deleteMany.mockResolvedValue({ count: 0 });
    mockedTransaction.expense.deleteMany.mockResolvedValue({ count: 0 });
    mockedTransaction.widget.delete.mockResolvedValue(widget);

    await expect(
      service.disconnectWidget('room-1', 'widget-1', { confirm: true }),
    ).resolves.toEqual({
      id: 'widget-1',
      type: 'chat',
      name: 'Chat',
    });

    expect(transaction.expense.findMany).toHaveBeenCalledWith({
      where: { widgetId: 'widget-1' },
      select: { id: true },
    });
    expect(transaction.widget.delete).toHaveBeenCalledWith({
      where: { id: 'widget-1' },
    });
  });

  it('blocks disconnecting an expense widget when unpaid shares exist', async () => {
    const widget = {
      id: 'widget-1',
      roomId: 'room-1',
      type: 'expenses',
      name: 'Expenses',
    };

    mockedTransaction.widget.findUnique.mockResolvedValue(widget);
    mockedTransaction.expense.findMany.mockResolvedValue([{ id: 'expense-1' }]);
    mockedTransaction.expenseShare.findFirst.mockResolvedValue({
      id: 'share-1',
    });

    await expect(
      service.disconnectWidget('room-1', 'widget-1', { confirm: true }),
    ).rejects.toThrow(ConflictException);
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

  describe('deleteRoom', () => {
    it('deletes the room when it exists', async () => {
      prisma.room.findUnique.mockResolvedValue(room);

      await expect(service.deleteRoom('room-1')).resolves.toEqual({
        roomId: 'room-1',
        deleted: true,
      });
      expect(prisma.room.delete).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
    });

    it('throws when the room does not exist', async () => {
      prisma.room.findUnique.mockResolvedValue(null);

      await expect(service.deleteRoom('room-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });
  });

  describe('leaveRoom', () => {
    it('marks a regular member as departed', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: RoomRole.MEMBER,
      });

      await expect(service.leaveRoom('room-1', 'user-1')).resolves.toEqual({
        roomId: 'room-1',
        leftUserId: 'user-1',
      });
      expect(prisma.roomMember.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { leftAt: expect.any(Date) as Date },
      });
    });

    it('requires an owner to transfer ownership before leaving', async () => {
      prisma.roomMember.findFirst.mockResolvedValue({
        id: 'owner-membership',
        role: RoomRole.OWNER,
      });

      await expect(service.leaveRoom('room-1', 'owner-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws when the user is not an active room member', async () => {
      prisma.roomMember.findFirst.mockResolvedValue(null);

      await expect(service.leaveRoom('room-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
