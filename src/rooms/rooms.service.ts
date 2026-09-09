import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaErrorCode } from '../common/enums/prisma-error-code.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { generateInviteCode } from './utils/invite-code.util';
import { RoomRole } from '../rbac/enums/room-role.enum';
import { JoinRoomDto } from './dto/join-room.dto';
import { JoinRoomResponseDto } from './dto/join-room-response.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async joinRoom(
    dto: JoinRoomDto,
    userId: string,
  ): Promise<JoinRoomResponseDto> {
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
          const updatedMembership = await tx.roomMember.update({
            where: { id: membership.id },
            data: { leftAt: null, role: RoomRole.MEMBER },
          });

          return {
            id: updatedMembership.id,
            roomId: updatedMembership.roomId,
            userId: updatedMembership.userId,
            role: updatedMembership.role,
          };
        }

        const newMembership = await tx.roomMember.create({
          data: { roomId: room.id, userId, role: RoomRole.MEMBER },
        });

        return {
          id: newMembership.id,
          roomId: newMembership.roomId,
          userId: newMembership.userId,
          role: newMembership.role,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code as PrismaErrorCode) === PrismaErrorCode.UNIQUE_CONSTRAINT
      ) {
        throw new ConflictException(ERROR_MESSAGES.ALREADY_ROOM_MEMBER);
      }
      throw error;
    }
  }
}
