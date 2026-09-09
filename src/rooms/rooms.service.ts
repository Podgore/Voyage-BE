import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoomRole } from '../../generated/prisma/client';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaErrorCode } from '../common/enums/prisma-error-code.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { JoinRoomResponseDto } from './dto/join-room-response.dto';
import { RoomListResponseDto } from './dto/room-list-response.dto';
import { RoomMemberResponseDto } from './dto/room-member-response.dto';
import { generateInviteCode } from './utils/invite-code.util';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto, userId: string) {
    const inviteCode = generateInviteCode();

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: { name: dto.name, inviteCode },
      });
      await tx.roomMember.create({
        data: { roomId: room.id, userId, role: RoomRole.OWNER },
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
        if (!room) throw new NotFoundException(ERROR_MESSAGES.ROOM_NOT_FOUND);

        const membership = await tx.roomMember.findUnique({
          where: { userId_roomId: { userId, roomId: room.id } },
        });
        if (membership?.leftAt === null) {
          throw new ConflictException(ERROR_MESSAGES.ALREADY_ROOM_MEMBER);
        }

        const member = membership
          ? await tx.roomMember.update({
              where: { id: membership.id },
              data: { leftAt: null, role: RoomRole.MEMBER },
            })
          : await tx.roomMember.create({
              data: { roomId: room.id, userId, role: RoomRole.MEMBER },
            });

        return {
          id: member.id,
          roomId: member.roomId,
          userId: member.userId,
          role: member.role,
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

  async findAll(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<RoomListResponseDto[]> {
    const memberships = await this.prisma.roomMember.findMany({
      where: { userId, leftAt: null },
      select: {
        room: {
          select: { id: true, name: true, inviteCode: true, createdAt: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return memberships.map(({ room }) => ({
      id: room.id,
      name: room.name,
      inviteCode: room.inviteCode,
      createdAt: room.createdAt,
    }));
  }

  async findMembers(
    roomId: string,
    includeDeparted = false,
  ): Promise<RoomMemberResponseDto[]> {
    const memberships = await this.prisma.roomMember.findMany({
      where: { roomId, ...(includeDeparted ? {} : { leftAt: null }) },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        leftAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
      leftAt: membership.leftAt,
      user: membership.user,
    }));
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

      if (targetMembership.role === RoomRole.OWNER) {
        throw new ConflictException(ERROR_MESSAGES.TARGET_ALREADY_OWNER);
      }

      await tx.roomMember.update({
        where: { userId_roomId: { roomId, userId: currentOwnerId } },
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
