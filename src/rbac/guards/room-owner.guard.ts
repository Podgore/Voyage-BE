import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RoomOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

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
        role: 'owner',
      },
    });

    if (!membership) {
      throw new ForbiddenException(ERROR_MESSAGES.NOT_ROOM_OWNER);
    }

    return true;
  }
}
