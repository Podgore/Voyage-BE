import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { BaseRoomAccessGuard } from './base-room-access.guard';

@Injectable()
export class RoomMemberGuard extends BaseRoomAccessGuard {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getRoleFilter() {
    return {};
  }

  protected getAccessDeniedMessage(userId: string) {
    return ERROR_MESSAGES.NOT_ROOM_MEMBER(userId);
  }
}
