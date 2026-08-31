import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { CreateRoomDto } from './dto/create-room.dto';
import { generateInviteCode } from './utils/invite-code.util';
import { RoomRole } from '../rbac/enums/room-role.enum';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoomDto, userId: string) {
    const inviteCode = generateInviteCode();
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          name: dto.name,
          inviteCode,
        },
      });
      await tx.roomMember.create({
        data: {
          roomId: room.id,
          userId,
          role: RoomRole.OWNER,
        },
      });
      return room;
    });
  }

  async transferOwnership(
    roomId: string,
    currentOwnerId: string,
    targetUserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const targetMembership = await tx.roomMember.findFirst({
        where: { roomId, userId: targetUserId, leftAt: null },
      });

      if (!targetMembership) {
        throw new NotFoundException(ERROR_MESSAGES.TARGET_NOT_ACTIVE_MEMBER);
      }

      if (targetMembership.role === (RoomRole.OWNER as string)) {
        throw new ConflictException(ERROR_MESSAGES.TARGET_ALREADY_OWNER);
      }

      await tx.roomMember.updateMany({
        where: { roomId, userId: currentOwnerId, role: RoomRole.OWNER },
        data: { role: RoomRole.MEMBER },
      });

      await tx.roomMember.update({
        where: { id: targetMembership.id },
        data: { role: RoomRole.OWNER },
      });

      return { roomId, newOwnerId: targetUserId };
    });
  }
}
