import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';

@Injectable()
export class RoomMembershipIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRoomIdForWidget(widgetId: string): Promise<string> {
    const widget = await this.prisma.widget.findUnique({
      where: { id: widgetId },
      select: { roomId: true },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found`);
    }

    return widget.roomId;
  }

  private async getRoomIdForExpense(expenseId: string): Promise<string> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      select: { widgetId: true },
    });

    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    return this.getRoomIdForWidget(expense.widgetId);
  }

  private async assertRoomMembersBelongToRoom(
    roomId: string,
    roomMemberIds: string[],
  ): Promise<void> {
    const uniqueIds = [...new Set(roomMemberIds)];

    const roomMembers = await this.prisma.roomMember.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, roomId: true },
    });

    if (roomMembers.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more roomMemberId values are invalid',
      );
    }

    for (const member of roomMembers) {
      if (member.roomId !== roomId) {
        throw new ForbiddenException(
          ERROR_MESSAGES.CROSS_ROOM_MEMBERSHIP(member.id, roomId),
        );
      }
    }
  }

  async assertWidgetRoomMembership(
    widgetId: string,
    roomMemberIds: string[],
  ): Promise<void> {
    const roomId = await this.getRoomIdForWidget(widgetId);
    await this.assertRoomMembersBelongToRoom(roomId, roomMemberIds);
  }

  async assertExpenseRoomMembership(
    expenseId: string,
    roomMemberIds: string[],
  ): Promise<void> {
    const roomId = await this.getRoomIdForExpense(expenseId);
    await this.assertRoomMembersBelongToRoom(roomId, roomMemberIds);
  }
}
