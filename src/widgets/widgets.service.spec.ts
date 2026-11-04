import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { createWidgetConnection } from './utils/widget-factory.util';
import { WidgetsService } from './widgets.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('WidgetsService', () => {
  let service: WidgetsService;
  const transaction = {
    widget: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    expenseShare: { findFirst: jest.fn() },
  };
  const prisma = {
    room: { findUnique: jest.fn() },
    $transaction: jest.fn(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WidgetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<WidgetsService>(WidgetsService);
  });

  it('lists connected widgets with their public fields', async () => {
    const widgets = [{ id: 'widget-1', type: WidgetType.CHAT, name: 'Chat' }];
    prisma.room.findUnique.mockResolvedValue({ id: 'room-1', widgets });

    await expect(service.findWidgets('room-1')).resolves.toEqual(widgets);
    expect(prisma.room.findUnique).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      select: {
        id: true,
        widgets: { select: { id: true, type: true, name: true } },
      },
    });
  });

  it('throws when listing widgets for a missing room', async () => {
    prisma.room.findUnique.mockResolvedValue(null);

    await expect(service.findWidgets('missing-room')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a widget connection with its display name', async () => {
    prisma.room.findUnique.mockResolvedValue({ id: 'room-1' });
    transaction.widget.create.mockResolvedValue({
      id: 'widget-1',
      roomId: 'room-1',
      type: WidgetType.CHAT,
      name: 'Chat',
    });

    await expect(
      service.connectWidget('room-1', { type: WidgetType.CHAT }),
    ).resolves.toEqual({
      id: 'widget-1',
      roomId: 'room-1',
      type: WidgetType.CHAT,
      name: 'Chat',
    });
    expect(transaction.widget.create).toHaveBeenCalledWith({
      data: createWidgetConnection('room-1', WidgetType.CHAT),
    });
  });

  it('rejects duplicate widget connections', async () => {
    prisma.room.findUnique.mockResolvedValue({ id: 'room-1' });
    transaction.widget.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.connectWidget('room-1', { type: WidgetType.CHAT }),
    ).rejects.toThrow(ConflictException);
  });

  it('does not disconnect an expenses widget with unpaid shares', async () => {
    transaction.widget.findFirst.mockResolvedValue({
      id: 'widget-1',
      type: WidgetType.EXPENSES,
    });
    transaction.expenseShare.findFirst.mockResolvedValue({ id: 'share-1' });

    await expect(
      service.disconnectWidget('room-1', 'widget-1'),
    ).rejects.toThrow(ConflictException);
    expect(transaction.widget.delete).not.toHaveBeenCalled();
  });

  it('throws when the widget is not connected to the room', async () => {
    transaction.widget.findFirst.mockResolvedValue(null);

    await expect(
      service.disconnectWidget('room-1', 'missing-widget'),
    ).rejects.toThrow(NotFoundException);
    expect(transaction.widget.delete).not.toHaveBeenCalled();
  });

  it('deletes a widget belonging to the room', async () => {
    transaction.widget.findFirst.mockResolvedValue({
      id: 'widget-1',
      type: WidgetType.CHAT,
    });

    await expect(
      service.disconnectWidget('room-1', 'widget-1'),
    ).resolves.toEqual({ widgetId: 'widget-1', isDeleted: true });
    expect(transaction.widget.delete).toHaveBeenCalledWith({
      where: { id: 'widget-1' },
    });
  });
});
