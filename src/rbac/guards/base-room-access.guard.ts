import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { RoomRole } from '../enums/room-role.enum';

export abstract class BaseRoomAccessGuard implements CanActivate {
  protected constructor(protected readonly prisma: PrismaService) {}

  protected abstract getRoleFilter(): { role?: RoomRole };
  protected abstract getAccessDeniedMessage(userId: string): string;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;
    const roomId = request.params.roomId;

    if (!userId) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
    }

    if (!roomId) {
      throw new BadRequestException(ERROR_MESSAGES.ROOM_ID_MISSING);
    }

    const membership = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        userId,
        leftAt: null,
        ...this.getRoleFilter(),
      },
    });

    if (!membership) {
      throw new ForbiddenException(this.getAccessDeniedMessage(userId));
    }

    return true;
  }
}
