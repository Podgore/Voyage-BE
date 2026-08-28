import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getRoomHub(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { widgets: true },
    });

    if (!room) {
      throw new NotFoundException(ERROR_MESSAGES.ROOM_NOT_FOUND);
    }

    const membership = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
    });

    return {
      id: room.id,
      name: room.name,
      myRole: membership?.role,
      widgets: room.widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        name: widget.name,
      })),
    };
  }
}
