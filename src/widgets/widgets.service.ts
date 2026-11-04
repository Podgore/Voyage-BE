import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { WidgetType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaErrorCode } from '../common/enums/prisma-error-code.enum';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectWidgetDto } from './dto/connect-widget.dto';
import { ConnectWidgetResponseDto } from './dto/connect-widget-response.dto';
import { DisconnectWidgetResponseDto } from './dto/disconnect-widget-response.dto';
import { WidgetResponseDto } from './dto/widget-response.dto';
import { createWidgetConnection } from './utils/widget-factory.util';

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findWidgets(roomId: string): Promise<WidgetResponseDto[]> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        widgets: {
          select: { id: true, type: true, name: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(ERROR_MESSAGES.ROOM_NOT_FOUND);
    }

    return room.widgets;
  }

  async connectWidget(
    roomId: string,
    dto: ConnectWidgetDto,
  ): Promise<ConnectWidgetResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(ERROR_MESSAGES.ROOM_NOT_FOUND);
    }

    const widgetConnection = createWidgetConnection(roomId, dto.type);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const widget = await tx.widget.create({ data: widgetConnection });

        return {
          id: widget.id,
          roomId: widget.roomId,
          type: widget.type,
          name: widget.name,
        };
      });
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError ||
          (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            typeof error.code === 'string')) &&
        error.code === PrismaErrorCode.UNIQUE_CONSTRAINT.toString()
      ) {
        throw new ConflictException(
          ERROR_MESSAGES.WIDGET_ALREADY_CONNECTED(dto.type),
        );
      }

      throw error;
    }
  }

  async disconnectWidget(
    roomId: string,
    widgetId: string,
  ): Promise<DisconnectWidgetResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const widget = await tx.widget.findFirst({
        where: { id: widgetId, roomId },
        select: { id: true, type: true },
      });

      if (!widget) {
        throw new NotFoundException(ERROR_MESSAGES.WIDGET_NOT_FOUND);
      }

      if (widget.type === WidgetType.EXPENSES) {
        const unpaidShare = await tx.expenseShare.findFirst({
          where: {
            isPaid: false,
            expense: { widgetId },
          },
          select: { id: true },
        });

        if (unpaidShare) {
          throw new ConflictException(
            ERROR_MESSAGES.WIDGET_HAS_UNPAID_EXPENSE_SHARES,
          );
        }
      }

      await tx.widget.delete({ where: { id: widgetId } });

      return { widgetId, isDeleted: true };
    });
  }
}
