import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

  async findAll(userId: string) {
    const memberships = await this.prisma.roomMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      include: {
        room: true,
      },
    });

    return memberships.map((membership) => membership.room);
  }

  async findMembers(roomId: string, includeDeparted = false) {
    const memberships = await this.prisma.roomMember.findMany({
      where: {
        roomId,
        ...(includeDeparted ? {} : { leftAt: null }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return memberships;
  }
}
