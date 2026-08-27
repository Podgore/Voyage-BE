import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { generateInviteCode } from './utils/invite-code.util';
import { RoomRole } from '../rbac/enums/room-role.enum';
import { JoinRoomDto } from './dto/join-room.dto';

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

  async join(dto: JoinRoomDto, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { inviteCode: dto.inviteCode },
        });

        if (!room) {
          throw new NotFoundException(ERROR_MESSAGES.ROOM_NOT_FOUND);
        }

        const membership = await tx.roomMember.findUnique({
          where: { userId_roomId: { userId, roomId: room.id } },
        });

        if (membership?.leftAt === null) {
          throw new ConflictException(ERROR_MESSAGES.ALREADY_ROOM_MEMBER);
        }

        if (membership) {
          return tx.roomMember.update({
            where: { id: membership.id },
            data: { leftAt: null, role: RoomRole.MEMBER },
          });
        }

        return tx.roomMember.create({
          data: { roomId: room.id, userId, role: RoomRole.MEMBER },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(ERROR_MESSAGES.ROOM_JOIN_FAILED);
    }
  }
}
