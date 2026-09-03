import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
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

  async findAll(userId: string): Promise<RoomResponseDto[]> {
    const memberships = await this.prisma.roomMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        room: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
            createdAt: true,
          },
        },
      },
    });

    return memberships.map(({ room }) => ({
      id: room.id,
      name: room.name,
      inviteCode: room.inviteCode,
      createdAt: room.createdAt,
    }));
  }
}
