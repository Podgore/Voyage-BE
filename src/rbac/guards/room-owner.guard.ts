import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { BaseRoomAccessGuard } from './base-room-access.guard';
import { RoomRole } from '../enums/room-role.enum';

@Injectable()
export class RoomOwnerGuard extends BaseRoomAccessGuard {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getRoleFilter() {
    return { role: RoomRole.OWNER };
  }

  protected getAccessDeniedMessage(userId: string) {
    return ERROR_MESSAGES.NOT_ROOM_OWNER(userId);
  }
}
