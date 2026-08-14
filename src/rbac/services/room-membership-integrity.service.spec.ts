import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RoomMembershipIntegrityService } from './room-membership-integrity.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RoomMembershipIntegrityService', () => {
  let service: RoomMembershipIntegrityService;
  let prisma: {
    widget: { findUnique: jest.Mock };
    expense: { findUnique: jest.Mock };
    roomMember: { findMany: jest.Mock };
  };

  let roomAId: string;
  let roomBId: string;
  let widgetInRoomAId: string;
  let memberOfRoomAId: string;
  let memberOfRoomBId: string;

  beforeEach(() => {
    roomAId = randomUUID();
    roomBId = randomUUID();
    widgetInRoomAId = randomUUID();
    memberOfRoomAId = randomUUID();
    memberOfRoomBId = randomUUID();

    prisma = {
      widget: { findUnique: jest.fn() },
      expense: { findUnique: jest.fn() },
      roomMember: { findMany: jest.fn() },
    };

    service = new RoomMembershipIntegrityService(
      prisma as unknown as PrismaService,
    );
  });

  describe('assertWidgetRoomMembership', () => {
    it('throws NotFoundException when widget does not exist', async () => {
      prisma.widget.findUnique.mockResolvedValue(null);

      await expect(
        service.assertWidgetRoomMembership(widgetInRoomAId, [memberOfRoomAId]),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when a roomMemberId does not exist', async () => {
      prisma.widget.findUnique.mockResolvedValue({ roomId: roomAId });
      prisma.roomMember.findMany.mockResolvedValue([]);

      await expect(
        service.assertWidgetRoomMembership(widgetInRoomAId, [memberOfRoomAId]),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException on a deliberate cross-room attempt', async () => {
      prisma.widget.findUnique.mockResolvedValue({ roomId: roomAId });
      prisma.roomMember.findMany.mockResolvedValue([
        { id: memberOfRoomBId, roomId: roomBId },
      ]);

      await expect(
        service.assertWidgetRoomMembership(widgetInRoomAId, [memberOfRoomBId]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('resolves when all room members belong to the widget room', async () => {
      prisma.widget.findUnique.mockResolvedValue({ roomId: roomAId });
      prisma.roomMember.findMany.mockResolvedValue([
        { id: memberOfRoomAId, roomId: roomAId },
      ]);

      await expect(
        service.assertWidgetRoomMembership(widgetInRoomAId, [memberOfRoomAId]),
      ).resolves.toBeUndefined();
    });

    it('validates multiple room members at once', async () => {
      const secondMemberOfRoomAId = randomUUID();
      prisma.widget.findUnique.mockResolvedValue({ roomId: roomAId });
      prisma.roomMember.findMany.mockResolvedValue([
        { id: memberOfRoomAId, roomId: roomAId },
        { id: secondMemberOfRoomAId, roomId: roomAId },
      ]);

      await expect(
        service.assertWidgetRoomMembership(widgetInRoomAId, [
          memberOfRoomAId,
          secondMemberOfRoomAId,
        ]),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertExpenseRoomMembership', () => {
    let expenseInRoomAId: string;

    beforeEach(() => {
      expenseInRoomAId = randomUUID();
    });

    it('throws NotFoundException when expense does not exist', async () => {
      prisma.expense.findUnique.mockResolvedValue(null);

      await expect(
        service.assertExpenseRoomMembership(expenseInRoomAId, [
          memberOfRoomAId,
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException on a deliberate cross-room attempt via expense', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        widgetId: widgetInRoomAId,
      });
      prisma.widget.findUnique.mockResolvedValue({ roomId: roomAId });
      prisma.roomMember.findMany.mockResolvedValue([
        { id: memberOfRoomBId, roomId: roomBId },
      ]);

      await expect(
        service.assertExpenseRoomMembership(expenseInRoomAId, [
          memberOfRoomBId,
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('resolves when room member belongs to the expense room', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        widgetId: widgetInRoomAId,
      });
      prisma.widget.findUnique.mockResolvedValue({ roomId: roomAId });
      prisma.roomMember.findMany.mockResolvedValue([
        { id: memberOfRoomAId, roomId: roomAId },
      ]);

      await expect(
        service.assertExpenseRoomMembership(expenseInRoomAId, [
          memberOfRoomAId,
        ]),
      ).resolves.toBeUndefined();
    });
  });
});
