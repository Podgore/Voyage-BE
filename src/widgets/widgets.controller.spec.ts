import { Test, TestingModule } from '@nestjs/testing';
import { WidgetType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('WidgetsController', () => {
  let controller: WidgetsController;
  const widgetsService = {
    findWidgets: jest.fn(),
    connectWidget: jest.fn(),
    disconnectWidget: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetsController],
      providers: [
        { provide: WidgetsService, useValue: widgetsService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    controller = module.get<WidgetsController>(WidgetsController);
  });

  it('lists widgets for a room', async () => {
    const widgets = [{ id: 'widget-1', type: WidgetType.CHAT, name: 'Chat' }];
    widgetsService.findWidgets.mockResolvedValue(widgets);

    await expect(controller.findWidgets('room-1')).resolves.toBe(widgets);
    expect(widgetsService.findWidgets).toHaveBeenCalledWith('room-1');
  });

  it('connects a widget to a room', async () => {
    const result = {
      id: 'widget-1',
      roomId: 'room-1',
      type: WidgetType.CHAT,
      name: 'Chat',
    };
    widgetsService.connectWidget.mockResolvedValue(result);

    await expect(
      controller.connectWidget('room-1', { type: WidgetType.CHAT }),
    ).resolves.toBe(result);
    expect(widgetsService.connectWidget).toHaveBeenCalledWith('room-1', {
      type: WidgetType.CHAT,
    });
  });

  it('disconnects a widget from a room', async () => {
    const result = { widgetId: 'widget-1', isDeleted: true };
    widgetsService.disconnectWidget.mockResolvedValue(result);

    await expect(
      controller.disconnectWidget('room-1', 'widget-1'),
    ).resolves.toBe(result);
    expect(widgetsService.disconnectWidget).toHaveBeenCalledWith(
      'room-1',
      'widget-1',
    );
  });
});
