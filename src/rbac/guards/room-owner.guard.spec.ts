import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RoomOwnerGuard } from './room-owner.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('RoomOwnerGuard', () => {
  let guard: RoomOwnerGuard;
  let prisma: { roomMember: { findFirst: jest.Mock } };

  const createContext = (
    user?: { userId: string },
    roomId?: string,
  ): ExecutionContext => {
    const request = {
      user,
      params: { roomId },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    prisma = {
      roomMember: {
        findFirst: jest.fn(),
      },
    };
    guard = new RoomOwnerGuard(prisma as unknown as PrismaService);
  });

  it('throws ForbiddenException when user is not authenticated', async () => {
    const context = createContext(undefined, 'room-1');

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when roomId param is missing', async () => {
    const context = createContext({ userId: 'user-1' }, undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when user is not the owner', async () => {
    prisma.roomMember.findFirst.mockResolvedValue(null);
    const context = createContext({ userId: 'user-1' }, 'room-1');

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.roomMember.findFirst).toHaveBeenCalledWith({
      where: {
        roomId: 'room-1',
        userId: 'user-1',
        leftAt: null,
        role: 'owner',
      },
    });
  });

  it('returns true when user is the room owner', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      role: 'owner',
    });
    const context = createContext({ userId: 'user-1' }, 'room-1');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
