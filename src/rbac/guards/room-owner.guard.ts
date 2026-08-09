import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthenticatedRequest {
  user?: { userId: string; email: string };
  params: { roomId?: string };
}

@Injectable()
export class RoomOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;
    const roomId = request.params.roomId;

    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (!roomId) {
      throw new ForbiddenException('roomId param is missing');
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
      throw new ForbiddenException('You must be the room owner');
    }

    return true;
  }
}
