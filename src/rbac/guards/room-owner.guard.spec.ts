import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RoomOwnerGuard } from './room-owner.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { createExecutionContext } from './test-utils/create-execution-context';

describe('RoomOwnerGuard', () => {
  let guard: RoomOwnerGuard;
  let prisma: { roomMember: { findFirst: jest.Mock } };
  let userId: string;
  let roomId: string;

  beforeEach(() => {
    userId = randomUUID();
    roomId = randomUUID();
    prisma = {
      roomMember: {
        findFirst: jest.fn(),
      },
    };
    guard = new RoomOwnerGuard(prisma as unknown as PrismaService);
  });

  it('throws UnauthorizedException when user is not authenticated', async () => {
    const context = createExecutionContext(undefined, roomId);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws BadRequestException when roomId param is missing', async () => {
    const context = createExecutionContext({ userId }, undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws ForbiddenException when user is not the owner', async () => {
    prisma.roomMember.findFirst.mockResolvedValue(null);
    const context = createExecutionContext({ userId }, roomId);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.roomMember.findFirst).toHaveBeenCalledWith({
      where: {
        roomId,
        userId,
        leftAt: null,
        role: 'owner',
      },
    });
  });

  it('returns true when user is the room owner', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({
      id: randomUUID(),
      role: 'owner',
    });
    const context = createExecutionContext({ userId }, roomId);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
